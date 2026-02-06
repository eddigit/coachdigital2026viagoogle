import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { BlogPost } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

// Fonction pour générer un slug à partir du titre
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retire les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace les non-alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Retire les tirets en début et fin
};

export const blogRouter = router({
  // Lister tous les articles (admin)
  listAll: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => mapDoc<BlogPost>(doc));
  }),

  // Lister les articles publiés (public)
  listPublished: publicProcedure.query(async () => {
    const snapshot = await firestore.collection('blog_posts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();
    return snapshot.docs.map(doc => mapDoc<BlogPost>(doc));
  }),

  // Récupérer un article par ID (admin)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const doc = await firestore.collection('blog_posts').doc(String(input.id)).get();
      if (!doc.exists) {
        throw new Error('Article non trouvé');
      }
      return mapDoc<BlogPost>(doc);
    }),

  // Récupérer un article par slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('blog_posts')
        .where('slug', '==', input.slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        throw new Error('Article non trouvé');
      }
      
      const doc = snapshot.docs[0];
      const post = mapDoc<BlogPost>(doc);
      
      // Incrémenter le compteur de vues
      await firestore.collection('blog_posts').doc(String(post.id)).update({
        viewCount: (post.viewCount || 0) + 1
      });
      
      return post;
    }),

  // Créer un article
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().min(1),
        coverImageUrl: z.string().optional(),
        authorName: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        tags: z.array(z.string()).default([]),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await getNextId('blog_posts');
      const slug = input.slug || generateSlug(input.title);
      
      // Vérifier l'unicité du slug
      const existingSlug = await firestore.collection('blog_posts')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      
      if (!existingSlug.empty) {
        throw new Error('Ce slug existe déjà. Veuillez en choisir un autre.');
      }
      
      const now = new Date();
      const publishedAt = input.status === 'published' ? now : null;
      
      await firestore.collection('blog_posts').doc(String(id)).set({
        ...input,
        id,
        slug,
        authorId: ctx.user.id,
        authorName: input.authorName || ctx.user.name,
        publishedAt,
        viewCount: 0,
        createdAt: now,
        updatedAt: now
      });
      
      return { success: true, id, slug };
    }),

  // Mettre à jour un article
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().min(1).optional(),
        coverImageUrl: z.string().optional(),
        authorName: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        tags: z.array(z.string()).optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, slug, status, ...updateData } = input;
      
      // Si le slug change, vérifier l'unicité
      if (slug) {
        const existingSlug = await firestore.collection('blog_posts')
          .where('slug', '==', slug)
          .limit(1)
          .get();
        
        if (!existingSlug.empty && Number(existingSlug.docs[0].id) !== id) {
          throw new Error('Ce slug existe déjà. Veuillez en choisir un autre.');
        }
      }
      
      // Récupérer l'article actuel pour gérer publishedAt
      const currentDoc = await firestore.collection('blog_posts').doc(String(id)).get();
      if (!currentDoc.exists) {
        throw new Error('Article non trouvé');
      }
      
      const currentData = currentDoc.data() as BlogPost;
      let publishedAt = currentData.publishedAt;
      
      // Si on passe de draft à published, définir publishedAt
      if (status === 'published' && currentData.status !== 'published' && !publishedAt) {
        publishedAt = new Date();
      }
      
      await firestore.collection('blog_posts').doc(String(id)).update({
        ...updateData,
        ...(slug && { slug }),
        ...(status && { status }),
        ...(publishedAt && { publishedAt }),
        updatedAt: new Date()
      });
      
      return { success: true };
    }),

  // Supprimer un article
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await firestore.collection('blog_posts').doc(String(input.id)).delete();
      return { success: true };
    }),

  // Rechercher des articles (public)
  search: publicProcedure
    .input(z.object({ 
      query: z.string(),
      tag: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let snapshot = await firestore.collection('blog_posts')
        .where('status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .get();
      
      let posts = snapshot.docs.map(doc => mapDoc<BlogPost>(doc));
      
      // Filtrer par query (titre, excerpt, tags)
      if (input.query) {
        const searchLower = input.query.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Filtrer par tag
      if (input.tag) {
        posts = posts.filter(post => post.tags.includes(input.tag));
      }
      
      return posts;
    }),

  // Récupérer les tags utilisés
  getTags: publicProcedure.query(async () => {
    const snapshot = await firestore.collection('blog_posts')
      .where('status', '==', 'published')
      .get();
    
    const allTags = new Set<string>();
    snapshot.docs.forEach(doc => {
      const post = mapDoc<BlogPost>(doc);
      post.tags.forEach(tag => allTags.add(tag));
    });
    
    return Array.from(allTags).sort();
  }),
});

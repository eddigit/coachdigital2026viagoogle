import { Link } from 'wouter';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          ← Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Éditeur du site</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Raison sociale :</strong> Coach Digital Paris</p>
              <p><strong className="text-foreground">Forme juridique :</strong> Entrepreneur individuel</p>
              <p><strong className="text-foreground">Siège social :</strong> 102 Avenue des Champs-Élysées, 5ème étage, 75008 Paris</p>
              <p><strong className="text-foreground">SIREN :</strong> 448 371 948</p>
              <p><strong className="text-foreground">SIRET :</strong> 448 371 948 00069</p>
              <p><strong className="text-foreground">N° TVA :</strong> FR75448371948</p>
              <p><strong className="text-foreground">Directeur de la publication :</strong> Gilles Korzec</p>
              <p><strong className="text-foreground">Email :</strong> contact@coachdigitalparis.com</p>
              <p><strong className="text-foreground">Téléphone :</strong> +33 6 52 34 51 80</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Hébergement</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Hébergeur :</strong> Vercel Inc.</p>
              <p><strong className="text-foreground">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p><strong className="text-foreground">Site web :</strong> https://vercel.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble du contenu de ce site est la propriété exclusive de Coach Digital Paris 
              et est protégé par les lois relatives à la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Protection des données (RGPD)</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside ml-4">
                <li>Droit d'accès</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition</li>
              </ul>
              <p className="mt-4">Contact : <strong className="text-foreground">contact@coachdigitalparis.com</strong></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intelligence Artificielle (AI Act)</h2>
            <div className="text-muted-foreground space-y-2">
              <p>
                Conformément à l'Article 50 du Règlement européen sur l'IA, nous vous informons 
                que nos services utilisent des systèmes d'intelligence artificielle.
              </p>
              <p className="italic">
                Vous serez informé lorsque vous interagissez directement avec un système d'IA.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2 text-foreground">Notre équipe hybride humain/IA :</h3>
                <ul className="space-y-1">
                  <li>• <strong className="text-amber-400">Gilles Korzec</strong> — Fondateur (humain)</li>
                  <li>• <strong className="text-blue-400">Oscar</strong> — Coordinateur (IA)</li>
                  <li>• <strong className="text-green-400">Jules</strong> — Tech Lead (IA)</li>
                  <li>• <strong className="text-purple-400">Nina</strong> — Commerciale (IA)</li>
                  <li>• <strong className="text-pink-400">Léa</strong> — Admin & Juridique (IA)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Cookies</h2>
            <p className="text-muted-foreground">
              Ce site utilise des cookies techniques nécessaires à son fonctionnement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Droit applicable</h2>
            <p className="text-muted-foreground">
              Les présentes mentions légales sont soumises au droit français. 
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <div className="pt-8 border-t border-border text-sm text-muted-foreground">
            Dernière mise à jour : 6 février 2026
          </div>
        </div>
      </div>
    </div>
  );
}

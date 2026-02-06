import { Link } from 'wouter';

export default function CGV() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          ← Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Article 1 — Identification du Prestataire</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Raison sociale :</strong> Coach Digital Paris</p>
              <p><strong className="text-foreground">Forme juridique :</strong> Entrepreneur Individuel (EI)</p>
              <p><strong className="text-foreground">Siège social :</strong> 102 Avenue des Champs-Élysées, 5ème étage, 75008 Paris</p>
              <p><strong className="text-foreground">SIREN :</strong> 448 371 948</p>
              <p><strong className="text-foreground">SIRET :</strong> 448 371 948 00069</p>
              <p><strong className="text-foreground">N° TVA :</strong> FR75448371948</p>
              <p><strong className="text-foreground">Email :</strong> contact@coachdigitalparis.com</p>
              <p><strong className="text-foreground">Téléphone :</strong> +33 6 52 34 51 80</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 2 — Objet et Champ d'Application</h2>
            <p className="text-muted-foreground mb-4">
              Les présentes Conditions Générales de Vente s'appliquent à l'ensemble 
              des prestations proposées par Coach Digital Paris à ses Clients professionnels.
            </p>
            <div className="text-muted-foreground">
              <p className="font-semibold mb-2 text-foreground">Prestations couvertes :</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Coaching et accompagnement digital</li>
                <li>Développement web et applications</li>
                <li>Agents IA et automatisation</li>
                <li>Audit juridique et conformité (mentions légales, RGPD)</li>
                <li>Formations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 3 — Devis et Commandes</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Les devis établis par Coach Digital Paris sont valables 30 jours à compter de leur date d'émission.</p>
              <p>La commande est considérée comme ferme et définitive après signature du devis par le Client et réception de l'acompte prévu.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 4 — Tarifs et Paiement</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Les prix sont indiqués en euros hors taxes (HT). La TVA applicable est celle en vigueur au jour de la facturation.</p>
              <div>
                <p className="font-semibold text-foreground mb-2">Retard de paiement :</p>
                <ul className="list-disc list-inside ml-4">
                  <li>Pénalités au taux de 3 fois le taux d'intérêt légal</li>
                  <li>Indemnité forfaitaire de 40 euros pour frais de recouvrement</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 5 — Utilisation d'Intelligence Artificielle</h2>
            <div className="text-muted-foreground space-y-4">
              <p>
                <strong className="text-foreground">Conformément au Règlement européen sur l'Intelligence Artificielle (AI Act)</strong>, 
                le Client est informé que Coach Digital Paris utilise des systèmes d'intelligence artificielle.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2 text-foreground">Notre équipe hybride humain/IA :</p>
                <ul className="space-y-1">
                  <li>• <strong className="text-amber-400">Gilles Korzec</strong> — Fondateur (humain)</li>
                  <li>• <strong className="text-blue-400">Oscar</strong> — Coordinateur (IA)</li>
                  <li>• <strong className="text-green-400">Jules</strong> — Tech Lead (IA)</li>
                  <li>• <strong className="text-purple-400">Nina</strong> — Commerciale (IA)</li>
                  <li>• <strong className="text-pink-400">Léa</strong> — Admin & Juridique (IA)</li>
                </ul>
              </div>
              <p>Ces systèmes fonctionnent sous supervision humaine.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 6 — Propriété Intellectuelle</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Coach Digital Paris conserve l'intégralité des droits de propriété intellectuelle sur les méthodes, outils et savoir-faire.</p>
              <p>Le Client acquiert, après paiement intégral, un droit d'utilisation non exclusif sur les livrables spécifiques.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 7 — Confidentialité</h2>
            <p className="text-muted-foreground">
              Les parties s'engagent à maintenir confidentielles les informations échangées. 
              Cette obligation s'applique pendant la durée du contrat et 2 ans après son terme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 8 — Responsabilité</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Coach Digital Paris est tenu à une obligation de moyens. Sa responsabilité ne peut être engagée qu'en cas de faute prouvée.</p>
              <p>La responsabilité est limitée au montant des sommes perçues au titre de la prestation concernée.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Article 9 — Droit Applicable</h2>
            <p className="text-muted-foreground">
              Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux de Paris seront seuls compétents.
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

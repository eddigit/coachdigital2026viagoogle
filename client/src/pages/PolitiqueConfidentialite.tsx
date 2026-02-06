import { Link } from 'wouter';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">
          ← Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Qui sommes-nous ?</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Coach Digital Paris</strong></p>
              <p>Gilles Korzec — Entrepreneur individuel</p>
              <p>SIREN : 448 371 948 | SIRET : 448 371 948 00069</p>
              <p>102 Avenue des Champs-Élysées, 5ème étage, 75008 Paris</p>
              <p>Email : contact@coachdigitalparis.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Données collectées</h2>
            <div className="text-muted-foreground space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-2">Données fournies :</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Identification : nom, prénom, fonction</li>
                  <li>Contact : email, téléphone, adresse</li>
                  <li>Facturation : SIRET, adresse de facturation</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">Données collectées automatiquement :</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Connexion : adresse IP, navigateur</li>
                  <li>Utilisation : pages visitées</li>
                  <li>Logs : horodatage des actions</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Utilisation de l'Intelligence Artificielle</h2>
            <div className="text-muted-foreground space-y-4">
              <p>
                <strong className="text-foreground">Conformément au Règlement européen sur l'IA (AI Act)</strong>, 
                nous vous informons que Coach Digital Paris utilise des systèmes d'IA.
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
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold mb-2 text-foreground">Garanties :</p>
                <ul className="space-y-1 text-sm">
                  <li>✓ <strong>Pas d'entraînement</strong> : Vos données ne sont jamais utilisées pour entraîner les modèles IA</li>
                  <li>✓ <strong>Supervision humaine</strong> : Toutes les décisions importantes sont validées par un humain</li>
                  <li>✓ <strong>Transparence</strong> : Vous êtes informé lorsque vous interagissez avec un système d'IA</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Partage des données</h2>
            <div className="text-muted-foreground space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-foreground">Prestataire</th>
                      <th className="text-left py-2 pr-4 text-foreground">Service</th>
                      <th className="text-left py-2 text-foreground">Localisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Anthropic</td>
                      <td className="py-2 pr-4">API IA (Claude)</td>
                      <td className="py-2">USA (DPA signé)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Vercel</td>
                      <td className="py-2 pr-4">Hébergement</td>
                      <td className="py-2">USA/UE</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Qonto</td>
                      <td className="py-2 pr-4">Paiements</td>
                      <td className="py-2">France</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-amber-400 font-semibold">Nous ne vendons JAMAIS vos données.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Conservation des données</h2>
            <div className="overflow-x-auto text-muted-foreground">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground">Type</th>
                    <th className="text-left py-2 text-foreground">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Données de compte</td>
                    <td className="py-2">Durée du contrat + 3 ans</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Données de facturation</td>
                    <td className="py-2">10 ans (obligation légale)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Logs de connexion</td>
                    <td className="py-2">1 an</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Vos droits (RGPD)</h2>
            <div className="text-muted-foreground space-y-4">
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong className="text-foreground">Accès</strong> — Obtenir une copie de vos données</li>
                <li><strong className="text-foreground">Rectification</strong> — Corriger des données inexactes</li>
                <li><strong className="text-foreground">Effacement</strong> — Demander la suppression</li>
                <li><strong className="text-foreground">Portabilité</strong> — Recevoir vos données</li>
                <li><strong className="text-foreground">Opposition</strong> — Vous opposer à certains traitements</li>
              </ul>
              <div className="p-4 bg-muted rounded-lg">
                <p><strong className="text-foreground">Contact :</strong> contact@coachdigitalparis.com</p>
                <p>Délai de réponse : 1 mois maximum</p>
              </div>
              <p className="text-sm">
                <strong>Réclamation :</strong> CNIL — <a href="https://www.cnil.fr" className="text-primary hover:underline">www.cnil.fr</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Sécurité</h2>
            <div className="text-muted-foreground space-y-4">
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Chiffrement des données (AES-256)</li>
                <li>Chiffrement en transit (TLS 1.3)</li>
                <li>Authentification forte (2FA)</li>
                <li>Sauvegardes quotidiennes chiffrées</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
            <div className="text-muted-foreground">
              <p>Coach Digital Paris</p>
              <p>Email : contact@coachdigitalparis.com</p>
              <p>102 Avenue des Champs-Élysées, 5ème étage, 75008 Paris</p>
            </div>
          </section>

          <div className="pt-8 border-t border-border text-sm text-muted-foreground">
            Dernière mise à jour : 6 février 2026
          </div>
        </div>
      </div>
    </div>
  );
}

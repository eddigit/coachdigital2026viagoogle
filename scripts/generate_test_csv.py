#!/usr/bin/env python3
"""
Script pour générer un fichier CSV de test avec 30 000 contacts
pour tester les performances d'import de leads
"""

import csv
import random
import string
from datetime import datetime

# Données de base pour la génération
PRENOMS = [
    "Jean", "Marie", "Pierre", "Sophie", "Michel", "Catherine", "Philippe", "Isabelle",
    "François", "Nathalie", "Laurent", "Sandrine", "Christophe", "Valérie", "Nicolas",
    "Céline", "Stéphane", "Anne", "Olivier", "Sylvie", "Thierry", "Martine", "Patrick",
    "Christine", "Éric", "Véronique", "Frédéric", "Corinne", "David", "Laurence",
    "Bruno", "Pascale", "Alain", "Brigitte", "Gilles", "Monique", "Bernard", "Dominique",
    "Jacques", "Florence", "Marc", "Hélène", "Didier", "Patricia", "Claude", "Françoise",
    "Yves", "Jacqueline", "Daniel", "Nicole", "André", "Joëlle", "Christian", "Chantal",
    "Antoine", "Émilie", "Thomas", "Julie", "Alexandre", "Camille", "Maxime", "Léa",
    "Hugo", "Manon", "Lucas", "Chloé", "Théo", "Emma", "Louis", "Inès", "Gabriel", "Jade"
]

NOMS = [
    "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
    "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
    "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Lefèvre",
    "Mercier", "Dupont", "Lambert", "Bonnet", "François", "Martinez", "Legrand", "Garnier",
    "Faure", "Rousseau", "Blanc", "Guérin", "Muller", "Henry", "Roussel", "Nicolas",
    "Perrin", "Morin", "Mathieu", "Clément", "Gauthier", "Dumont", "Lopez", "Fontaine",
    "Chevalier", "Robin", "Masson", "Sanchez", "Gérard", "Nguyen", "Boyer", "Denis",
    "Lemaire", "Duval", "Joly", "Gautier", "Roger", "Roche", "Roy", "Noël", "Meyer",
    "Lucas", "Meunier", "Jean", "Pérez", "Marchand", "Dufour", "Blanchard", "Marie"
]

ENTREPRISES = [
    "Cabinet Juridique", "Avocat Conseil", "Cabinet d'Avocats", "Étude Notariale",
    "Cabinet Fiscal", "Conseil Juridique", "Barreau de Paris", "Cabinet Droit des Affaires",
    "Cabinet Droit Social", "Cabinet Propriété Intellectuelle", "Cabinet Droit Immobilier",
    "Cabinet Droit Pénal", "Cabinet Droit de la Famille", "Cabinet Contentieux",
    "Entreprise Tech", "Startup Innovation", "Société Conseil", "Groupe Industriel",
    "PME Services", "ETI France", "Holding Investissement", "Société Immobilière",
    "Cabinet Comptable", "Expertise Comptable", "Audit & Conseil", "Finance Conseil",
    "Assurance Mutuelle", "Banque Régionale", "Fonds d'Investissement", "Private Equity"
]

POSTES = [
    "Avocat associé", "Avocat collaborateur", "Avocat stagiaire", "Notaire",
    "Juriste d'entreprise", "Directeur juridique", "Responsable juridique",
    "Chef d'entreprise", "Directeur général", "PDG", "Gérant", "Fondateur",
    "Directeur financier", "DAF", "Expert-comptable", "Commissaire aux comptes",
    "Consultant", "Manager", "Directeur commercial", "Responsable RH",
    "Directeur technique", "CTO", "DSI", "Directeur marketing", "CMO"
]

SOURCES = [
    "LinkedIn", "Salon professionnel", "Recommandation", "Site web", "Networking",
    "Conférence", "Webinaire", "Partenariat", "Annuaire professionnel", "Cold outreach"
]

def generate_email(prenom, nom, entreprise_index):
    """Génère un email unique basé sur le prénom, nom et un index"""
    domain_suffixes = ["avocat.fr", "cabinet.fr", "conseil.fr", "entreprise.fr", "pro.fr", "legal.fr"]
    domain = domain_suffixes[entreprise_index % len(domain_suffixes)]
    # Ajouter un identifiant unique pour éviter les doublons
    unique_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{prenom.lower()}.{nom.lower()}.{unique_id}@{domain}"

def generate_phone():
    """Génère un numéro de téléphone français"""
    prefixes = ["06", "07"]
    return f"{random.choice(prefixes)} {random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)}"

def generate_leads(count):
    """Génère une liste de leads"""
    leads = []
    for i in range(count):
        prenom = random.choice(PRENOMS)
        nom = random.choice(NOMS)
        entreprise = f"{random.choice(ENTREPRISES)} {random.choice(['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Nantes', 'Toulouse', 'Nice', 'Strasbourg', 'Rennes'])}"
        
        lead = {
            "firstName": prenom,
            "lastName": nom,
            "email": generate_email(prenom, nom, i),
            "phone": generate_phone(),
            "company": entreprise,
            "position": random.choice(POSTES),
            "potentialAmount": random.choice([5000, 8000, 10000, 15000, 20000, 25000, 30000, 50000]),
            "probability": random.choice([10, 20, 25, 30, 40, 50, 60, 70, 80]),
            "source": random.choice(SOURCES),
            "notes": f"Contact généré pour test - Lead #{i+1}"
        }
        leads.append(lead)
        
        if (i + 1) % 5000 == 0:
            print(f"Généré {i + 1} leads...")
    
    return leads

def main():
    print("Génération de 30 000 contacts de test...")
    print("=" * 50)
    
    start_time = datetime.now()
    leads = generate_leads(30000)
    
    # Écrire le fichier CSV
    output_file = "/home/ubuntu/coach_digital/test_leads_30000.csv"
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=leads[0].keys())
        writer.writeheader()
        writer.writerows(leads)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"✅ Fichier généré : {output_file}")
    print(f"📊 Nombre de contacts : {len(leads)}")
    print(f"⏱️  Temps de génération : {duration:.2f} secondes")
    print(f"📁 Taille estimée : ~{len(leads) * 150 / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()

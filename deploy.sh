#!/bin/bash

# Script de déploiement pour Coach Digital

echo "🚀 Préparation du déploiement..."

# 1. Vérifier que l'utilisateur est connecté à Firebase
if ! firebase login --list > /dev/null 2>&1; then
  echo "⚠️  Vous n'êtes pas connecté à Firebase CLI."
  echo "👉 Veuillez exécuter : firebase login"
  exit 1
fi

# 2. Construire le projet
echo "📦 Construction du projet..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la construction."
  exit 1
fi

# 3. Déployer sur Firebase
echo "🔥 Déploiement sur Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
  echo "✅ Déploiement réussi !"
  echo "🌍 Votre application est en ligne."
else
  echo "❌ Erreur lors du déploiement."
  echo "Vérifiez les logs pour plus de détails."
fi

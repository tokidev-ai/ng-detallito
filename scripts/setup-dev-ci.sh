#!/usr/bin/env bash
# Una sola vez: deja que GitHub Actions despliegue al proyecto dev, igual que a prod.
# Crea la service account ci-deploy en giftcards-bo-dev con los mismos roles que la de
# prod y la ata al pool de Workload Identity (vive en prod) para este repo.
set -euo pipefail
P=giftcards-bo-dev
SA=ci-deploy@$P.iam.gserviceaccount.com

gcloud iam service-accounts describe $SA --project $P >/dev/null 2>&1 \
  || gcloud iam service-accounts create ci-deploy --display-name "CI deploy (GitHub)" --project $P
for r in datastore.user firebaseauth.admin firebasehosting.admin firebaserules.admin serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/$r --condition=None --quiet >/dev/null
  echo "✓ roles/$r"
done
gcloud iam service-accounts add-iam-policy-binding $SA --project $P --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/410167250500/locations/global/workloadIdentityPools/github/attribute.repository/tokidev-ai/ng-detallito" >/dev/null
echo "✓ GitHub (tokidev-ai/ng-detallito) puede desplegar a $P"

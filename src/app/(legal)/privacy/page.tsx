import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Horde Portal",
  description: "Politique de confidentialité et protection des données du portail client Horde",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Politique de confidentialité</h1>
      <p className="lead">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-BE", { month: "long", year: "numeric" })}
      </p>

      <p>
        Horde Agence Web s'engage à protéger votre vie privée. Cette politique de confidentialité
        explique comment nous collectons, utilisons et protégeons vos données personnelles lorsque
        vous utilisez notre portail client.
      </p>

      <h2>1. Responsable du traitement</h2>
      <address className="not-italic bg-muted p-4 rounded-lg">
        <strong>Horde Agence Web</strong><br />
        Activité exercée via SMart<br />
        Email : <a href="mailto:hello@hordeagence.com">hello@hordeagence.com</a><br />
        Site web : <a href="https://hordeagence.com" target="_blank" rel="noopener noreferrer">hordeagence.com</a>
      </address>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>

      <h3>2.1 Données d'identification</h3>
      <ul>
        <li>Nom et prénom</li>
        <li>Adresse email</li>
        <li>Nom de l'entreprise (optionnel)</li>
        <li>Photo de profil (optionnel)</li>
      </ul>

      <h3>2.2 Données de connexion</h3>
      <ul>
        <li>Adresse IP</li>
        <li>Date et heure de connexion</li>
        <li>Type de navigateur</li>
        <li>Pages visitées</li>
      </ul>

      <h3>2.3 Données de projet</h3>
      <ul>
        <li>Fichiers que vous téléchargez ou consultez</li>
        <li>Commentaires que vous publiez</li>
        <li>Actions de validation ou demandes de révision</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Vous permettre d'accéder à votre espace client</li>
        <li>Assurer le suivi de vos projets</li>
        <li>Vous envoyer des notifications relatives à vos projets</li>
        <li>Améliorer nos services et votre expérience utilisateur</li>
        <li>Répondre à vos demandes de support</li>
        <li>Respecter nos obligations légales</li>
      </ul>

      <h2>4. Base légale du traitement</h2>
      <p>Le traitement de vos données repose sur :</p>
      <ul>
        <li><strong>L'exécution du contrat</strong> : le traitement est nécessaire à la fourniture de nos services</li>
        <li><strong>L'intérêt légitime</strong> : amélioration de nos services, sécurité du site</li>
        <li><strong>Le consentement</strong> : pour l'envoi de communications marketing (si applicable)</li>
      </ul>

      <h2>5. Destinataires des données</h2>
      <p>Vos données peuvent être partagées avec :</p>
      <ul>
        <li><strong>Supabase</strong> (hébergement de la base de données) - UE/US</li>
        <li><strong>Vercel</strong> (hébergement du site) - US</li>
        <li><strong>Resend</strong> (envoi d'emails) - US</li>
      </ul>
      <p>
        Ces prestataires sont soumis à des clauses contractuelles garantissant la protection de vos
        données conformément au RGPD.
      </p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte</strong> : conservées pendant la durée de la relation commerciale, puis 3 ans après la fin de celle-ci</li>
        <li><strong>Données de projet</strong> : conservées pendant la durée du projet et 5 ans après sa clôture</li>
        <li><strong>Logs de connexion</strong> : conservés pendant 1 an</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d'accès</strong> : obtenir la confirmation que vos données sont traitées et en obtenir une copie</li>
        <li><strong>Droit de rectification</strong> : faire corriger vos données inexactes ou incomplètes</li>
        <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
        <li><strong>Droit à la limitation</strong> : demander la limitation du traitement de vos données</li>
        <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
        <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à :{" "}
        <a href="mailto:hello@hordeagence.com">hello@hordeagence.com</a>
      </p>
      <p>
        Vous avez également le droit d'introduire une réclamation auprès de l'Autorité de protection
        des données (APD) : <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer">www.autoriteprotectiondonnees.be</a>
      </p>

      <h2>8. Sécurité des données</h2>
      <p>Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :</p>
      <ul>
        <li>Chiffrement des données en transit (HTTPS/TLS)</li>
        <li>Authentification sécurisée par lien magique (sans mot de passe)</li>
        <li>Accès restreint aux données par rôle</li>
        <li>Sauvegardes régulières</li>
        <li>Surveillance et audit des accès</li>
      </ul>

      <h2>9. Cookies</h2>
      <p>
        Notre site utilise uniquement des cookies techniques nécessaires au fonctionnement du service :
      </p>
      <ul>
        <li><strong>Cookie de session</strong> : maintient votre connexion active</li>
        <li><strong>Cookie d'authentification</strong> : sécurise votre accès au portail</li>
      </ul>
      <p>
        Aucun cookie publicitaire, de traçage ou d'analyse tiers n'est utilisé.
      </p>

      <h2>10. Transferts internationaux</h2>
      <p>
        Certaines de nos sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés par
        des clauses contractuelles types approuvées par la Commission européenne, garantissant un
        niveau de protection adéquat de vos données.
      </p>

      <h2>11. Modifications</h2>
      <p>
        Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications
        seront publiées sur cette page avec une date de mise à jour. Nous vous informerons des
        modifications importantes par email.
      </p>

      <h2>12. Contact</h2>
      <p>
        Pour toute question concernant cette politique de confidentialité ou vos données personnelles,
        contactez-nous :
      </p>
      <address className="not-italic bg-muted p-4 rounded-lg">
        <strong>Horde Agence Web</strong><br />
        Email : <a href="mailto:hello@hordeagence.com">hello@hordeagence.com</a><br />
        Site web : <a href="https://hordeagence.com" target="_blank" rel="noopener noreferrer">hordeagence.com</a>
      </address>
    </article>
  );
}

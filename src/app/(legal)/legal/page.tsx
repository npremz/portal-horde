import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | Horde Portal",
  description: "Mentions légales du portail client Horde Agence Web",
};

export default function LegalPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Mentions légales</h1>
      <p className="lead">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-BE", { month: "long", year: "numeric" })}
      </p>

      <h2>1. Éditeur du site</h2>
      <p>
        Le portail client accessible à l&apos;adresse <strong>portal.hordeagence.com</strong> est édité par :
      </p>
      <address className="not-italic bg-muted p-4 rounded-lg">
        <strong>Horde Agence Web</strong><br />
        Activité exercée via SMart (Société Mutuelle pour Artistes)<br />
        Numéro d&apos;entreprise SMart : BE 0896.755.397<br />
        <br />
        Site web : <a href="https://hordeagence.com" target="_blank" rel="noopener noreferrer">hordeagence.com</a><br />
        Email : <a href="mailto:hello@hordeagence.com">hello@hordeagence.com</a>
      </address>

      <h2>2. Hébergement</h2>
      <p>
        Ce site est hébergé par :
      </p>
      <address className="not-italic bg-muted p-4 rounded-lg">
        <strong>Vercel Inc.</strong><br />
        440 N Barranca Ave #4133<br />
        Covina, CA 91723<br />
        États-Unis<br />
        <br />
        Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </address>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments constituant ce site (textes, graphismes, logiciels, photographies, images,
        vidéos, sons, plans, logos, marques, etc.) sont la propriété exclusive de Horde Agence Web ou
        de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation
        de tout ou partie des éléments du site est interdite sans autorisation préalable écrite.
      </p>

      <h2>4. Données personnelles</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits
        concernant vos données personnelles. Pour plus d&apos;informations, consultez notre{" "}
        <a href="/privacy">Politique de confidentialité</a>.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Ce site utilise des cookies strictement nécessaires au fonctionnement du service
        (authentification, session utilisateur). Aucun cookie publicitaire ou de traçage n&apos;est utilisé.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        Les informations contenues sur ce site sont aussi précises que possible. Toutefois, Horde Agence Web
        ne peut garantir l&apos;exactitude, la complétude et l&apos;actualité des informations diffusées.
        L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait des informations et contenus du site.
      </p>

      <h2>7. Liens hypertextes</h2>
      <p>
        Ce site peut contenir des liens vers d&apos;autres sites web. Horde Agence Web n&apos;exerce aucun contrôle
        sur ces sites et décline toute responsabilité quant à leur contenu.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit belge. En cas de litige, les tribunaux
        de Bruxelles seront seuls compétents.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question concernant ces mentions légales, vous pouvez nous contacter à l&apos;adresse :{" "}
        <a href="mailto:hello@hordeagence.com">hello@hordeagence.com</a>
      </p>
    </article>
  );
}

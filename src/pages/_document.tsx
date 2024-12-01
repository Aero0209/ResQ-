import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Supprimer le script Google Maps d'ici */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 
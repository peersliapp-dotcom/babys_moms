import { Helmet } from 'react-helmet-async'

const SITE_NAME = "Baby's and Mom's Clothing"
const SITE_URL = 'https://babysandmoms.net'
const DEFAULT_IMAGE = 'https://i.ibb.co.com/v4388nf3/657371760-122097034964914680-2462231761944454697-n.jpg'
const DEFAULT_DESCRIPTION =
  "Premium baby and maternity clothing from Bangladesh, crafted with the softest fabrics and utmost care. Made with love, for you & your little one."

interface SeoProps {
  title?: string
  description?: string
  image?: string
  /** Path only, e.g. "/shop" or "/product/some-slug" */
  path?: string
  type?: 'website' | 'product' | 'article'
  /** Optional JSON-LD structured data object */
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path = '',
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Made with love, for you & your little one`
  const canonical = `${SITE_URL}${path}`

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}

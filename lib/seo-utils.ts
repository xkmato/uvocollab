// SEO utility functions and components for structured data

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint: {
    '@type': 'ContactPoint';
    contactType: string;
    email: string;
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  provider: {
    '@type': 'Organization' | 'Person';
    name: string;
  };
  description: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UvoCollab',
    url: 'https://uvocollab.com',
    logo: 'https://uvocollab.com/logo.png',
    sameAs: [
      'https://twitter.com/uvocollab',
      'https://instagram.com/uvocollab',
      'https://linkedin.com/company/uvocollab',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'hello@uvotamstudio.com',
    },
  };
}

export function generateServiceSchema(
  serviceName: string,
  providerName: string,
  description: string,
  price: number
): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    provider: {
      '@type': 'Person',
      name: providerName,
    },
    description,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: 'USD',
    },
  };
}

export function generatePersonSchema(
  name: string,
  profileUrl: string,
  imageUrl?: string,
  bio?: string,
  jobTitle?: string
): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: profileUrl,
    image: imageUrl,
    jobTitle,
    description: bio,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateWebPageSchema(
  name: string,
  description: string,
  url: string,
  datePublished?: string,
  dateModified?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    datePublished,
    dateModified,
    publisher: {
      '@type': 'Organization',
      name: 'UvoCollab',
      logo: {
        '@type': 'ImageObject',
        url: 'https://uvocollab.com/logo.png',
      },
    },
  };
}

export function generateMarketplaceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UvoCollab Marketplace',
    description: 'Verified music and podcast industry professionals offering collaboration services',
    url: 'https://uvocollab.com/marketplace',
  };
}

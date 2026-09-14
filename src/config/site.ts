export const siteConfig = {
  name: 'Kinh Thánh Là Lẽ Thật',
  shortName: 'Lẽ Thật',
  description:
    'Không gian học, đọc và tìm hiểu Kinh Thánh bằng tiếng Việt theo từng chủ đề rõ ràng.',
  contact: {
    zalo: '#contact-form',
    telegram: '#contact-form',
    email: 'mailto:hello@example.com',
  },
  contactFormEndpoint: '',
} as const;

export const mainNavigation = [
  { href: '/', label: 'Trang chủ' },
  { href: '/kinh-thanh/', label: 'Kinh Thánh' },
  { href: '/le-that/', label: 'Lẽ Thật' },
  { href: '/lien-he/', label: 'Liên hệ' },
] as const;

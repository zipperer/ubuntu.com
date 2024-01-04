export const ENDPOINTS = {
   customerInfo: "/account/customer-info*",
   preview: "/pro/purchase/preview*"
 };

export const getRandomEmail = () =>
  `playwright-test-${Math.random().toString(36).substring(2,12)}@canonical.com`;

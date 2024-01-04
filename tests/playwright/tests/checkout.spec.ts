import { test, expect } from "@playwright/test";
import { selectProducts, acceptCookiePolicy, login, acceptTerms, clickRecaptcha } from "../helpers/commands";
import { customerInfoPost, customerInfoResponse, getPurchaseResponse, paymentMethodResponse, postEnsureResponse, postInvoiceResponse, postPurchase, postPurchasePreview, previewResponse, subscriptions } from "../helpers/mockData";
import { ENDPOINTS } from "../helpers/utils";

test.describe("Checkout - Region and taxes", () => {
  test("It should show correct non-VAT price", async ({page}) => {
    await page.goto("/pro/subscribe")
    await acceptCookiePolicy(page)
    await selectProducts(page);
    await page.getByRole("button", { name: "Buy now" }).click();

    await login(page);
    
    await page.route(ENDPOINTS.customerInfo,  async (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({...customerInfoResponse, "customerInfo": {...customerInfoResponse.customerInfo, "address": {...customerInfoResponse.customerInfo.address, "country": "AF" }}})
      });
    });

    await page.route(ENDPOINTS.preview,  async (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(previewResponse)
      });
    });
   
    await page.locator(
      ":nth-child(1) > .p-stepped-list__content > .row > .u-align--right > .p-action-button"
    ).click(); // Click "Edit" button
    await page.getByLabel("Country/Region:").selectOption({ label: 'Afghanistan' })
    await page.locator(".u-align--right > :nth-child(2)").click(); // Click "Save" button

    const country = await page.$('[data-testid="country"]')
    const countryText = await country?.innerText();

    expect(countryText).toBe("Afghanistan")
    expect(await page.$('[data-testid="total"]')).toBeNull();
    expect(await page.$('[data-testid="tax"]')).toBeNull();
  })
})

test.describe("Checkout purchase", ()=>{
  test("It should purchase", async ({page}) => {
    await page.goto("/pro/subscribe")
    await acceptCookiePolicy(page)
    await selectProducts(page);
    await page.getByRole("button", { name: "Buy now" }).click();

    await login(page);
    await expect(page).toHaveURL('/account/checkout');

    await acceptTerms(page)
    await clickRecaptcha(page)

    await page.waitForTimeout(1000);

    await page.route(ENDPOINTS.ensure, async (route)=>{
      route.fulfill({
        status: 200,
        body: JSON.stringify(postEnsureResponse)
      });
    })
    await page.route(ENDPOINTS.preview, async (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(postPurchasePreview)
      });
    })
    await page.route(ENDPOINTS.postPurchase, async (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(postPurchase)
      });
    })
    await page.route(ENDPOINTS.getPurchase, async(route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(getPurchaseResponse)
      })
    })
    await page.route(ENDPOINTS.customerInfo, async(route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(customerInfoPost)
      })
    })
    await page.route(ENDPOINTS.postInvoice, async(route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(postInvoiceResponse)
      })
    })
    await page.route(ENDPOINTS.stripePaymentMethod, async(route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(paymentMethodResponse)
      })
    })
    await page.route(ENDPOINTS.marketo, async(route) => {
      route.fulfill({
        status: 200,
      })
    });
    await page.route(ENDPOINTS.getSubscription, async(route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(subscriptions)
      })
    })
    
    await page.getByRole("button",{ name: "Buy"}).click()
    
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL('/pro/dashboard')

    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator('h5').filter({ hasText: 'Ubuntu Pro (Infra-only)' })).toBeVisible();
    });
  });
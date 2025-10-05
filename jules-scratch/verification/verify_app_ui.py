import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Navigate to the Shiny app
            await page.goto("http://localhost:8154")

            # Wait for the main content to be visible to ensure the app has loaded
            await expect(page.locator("#main-content")).to_be_visible(timeout=20000)

            # Take a screenshot of the light theme
            await page.screenshot(path="jules-scratch/verification/light_mode.png")

            # Find and click the theme toggle button
            theme_toggle_button = page.locator("#theme_toggle")
            await theme_toggle_button.click()

            # Wait for the body to have the 'dark' class
            await expect(page.locator("body")).to_have_class("dark", timeout=5000)

            # Take a screenshot of the dark theme
            await page.screenshot(path="jules-scratch/verification/dark_mode.png")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()

asyncio.run(main())
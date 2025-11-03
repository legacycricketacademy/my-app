# Copilot Review Guidelines for SYF Automation

- Do not allow hardcoded locators in tests or page objects.
- All locators must live in JSON/properties under `src/test/resources/locators` (or `src/main/resources` for drivers).
- All Page Object classes must extend `BasePage`.
- No `Thread.sleep()`; require explicit waits/ExpectedConditions utilities.
- TestNG lifecycle: `@BeforeMethod` and `@AfterMethod` are required in UI/mobile tests.
- Step definitions (BDD) contain only **business/behavior**; no raw WebDriver/Appium calls.
- Naming: test classes `*Test`, test methods `should<DoSomethingMeaningful>()`.

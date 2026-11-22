import { LoginUserModel } from "@_src/models/user.model";
import { BasePage } from "@_src/pages/base.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class LoginPage extends BasePage {
  url = "/logowanie";
  userLoginInput: Locator;
  userPasswordInput: Locator;
  loginButton: Locator;
  registerButton: Locator;
  loginError: Locator;
  userLoginFieldError: Locator;
  userPasswordFieldError: Locator;

  constructor(page: Page) {
    super(page);
    this.userLoginInput = this.page.getByTestId("input-login");
    this.userPasswordInput = this.page.getByTestId("input-password");
    this.loginButton = this.page.getByTestId("btn-login");
    this.registerButton = this.page.getByTestId("btn-register");
    this.loginError = this.page.getByTestId("login-error");
    this.userLoginFieldError = this.page.getByTestId("error-login");
    this.userPasswordFieldError = this.page.getByTestId("error-password");
  }

  @step("Zaloguj użytkownika")
  async login(loginUserData: LoginUserModel): Promise<MyTripsPage> {
    await this.userLoginInput.fill(loginUserData.userLogin);
    await this.userPasswordInput.fill(loginUserData.userPassword);
    await this.loginButton.click();

    return new MyTripsPage(this.page);
  }

  @step("Zarejestruj użytkownika")
  async register(registerUserData: LoginUserModel): Promise<MyTripsPage> {
    await this.userLoginInput.fill(registerUserData.userLogin);
    await this.userPasswordInput.fill(registerUserData.userPassword);
    await this.registerButton.click();

    return new MyTripsPage(this.page);
  }
}

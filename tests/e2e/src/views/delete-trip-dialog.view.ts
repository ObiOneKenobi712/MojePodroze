import { MyTripsPage } from "@_src/pages/my-trips.page";
import { step } from "@_src/utils/step.decorator";
import { ConfirmDialogView } from "@_src/views/confirm-dialog.view";

export class DeleteTripDialogView extends ConfirmDialogView {
  @step("Potwierdź usunięcie podróży")
  async confirmDelete(): Promise<MyTripsPage> {
    await this.confirmButton.click();
    return new MyTripsPage(this.page);
  }
}

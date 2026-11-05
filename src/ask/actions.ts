// What each of the catalog's actions does when a button in an answer is
// pressed. The params are checked against the catalog first. Nothing here
// changes data on its own: create_discount opens Doorlist's own dialog, and
// the server decides whether the code is created.
import { catalog } from "./catalog";

export type DiscountRequest = { showId: string; percent: number };

// The Ask panel tells us how to open its discount dialog.
let openDiscount: (request: DiscountRequest) => void = () => {};
export function whenDiscountRequested(open: (request: DiscountRequest) => void) {
  openDiscount = open;
}

export const actions = {
  open_show: async (params: unknown) => {
    const { showId } = catalog.data.actions.open_show.params.parse(params);
    location.hash = `/shows/${showId}`;
  },
  create_discount: async (params: unknown) => {
    openDiscount(catalog.data.actions.create_discount.params.parse(params));
  },
};

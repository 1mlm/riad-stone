import { WebHaptics } from "web-haptics";

const webHaptics = new WebHaptics();

export const haptic = webHaptics.trigger.bind(webHaptics);

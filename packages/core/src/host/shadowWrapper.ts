class ShadowWrapper {
	#root: ShadowRoot | undefined;
	#wrapper: HTMLDivElement | undefined;
	// #_host: HTMLDivElement | undefined;

	/**
	 * From: https://github.com/crackbob/ballcrack/blob/01c625b5545aa93aded44c8b27b878029dddf883/src/shadowWrapper.js#L5C30-L20C50
	 * @returns A closed shadow root
	 */
	#makeShadowRoot() {
		const iframe = document.createElement("iframe");
		document.body.appendChild(iframe);

		const attachShadow = (iframe.contentWindow as Window & typeof globalThis).Element.prototype
			.attachShadow;
		iframe.remove();

		const container = document.createElement("div");
		const shadow = attachShadow.apply(container, [{ mode: "closed" }]) as ShadowRoot;
		document.body.appendChild(container);
		// this.#_host = container;
		return shadow;
	}

	/**
	 * From: https://github.com/crackbob/ballcrack/blob/01c625b5545aa93aded44c8b27b878029dddf883/src/shadowWrapper.js#L5C30-L20C50
	 * @returns A div element inside of a shadow root
	 */
	#makeShadowWrapper() {
		this.#root ??= this.#makeShadowRoot();

		const hostEl = document.createElement("div");
		this.#root.appendChild(hostEl);

		return hostEl;
	}

	get root() {
		this.#root ??= this.#makeShadowRoot();
		return this.#root;
	}

	get wrapper() {
		this.#wrapper ??= this.#makeShadowWrapper();
		return this.#wrapper;
	}

	/**
	 * Don't make this public or use this outside of this shadow wrapper.
	 * Why? Because pretty much everything you can do with this can also be done with the shadow wrapper.
	 * Putting stuff in the document's body is detectable.
	 * I don't know a way to create a shadow root without a div wrapper.
	 * Vector doesn't really care about doing client-sided detections as of right now, so we're fine.
	 * This is now fully private.
	 * Don't make it public, since if you can make something with this,
	 * you can most likely do it with the normal wrapper.
	 */
	// get #host() {
	// 	this.#root ??= this.#makeShadowRoot();
	// 	return this.#_host;
	// }
}

export default new ShadowWrapper;


function isTouchDevice() {
	return 'ontouchstart' in window || !!(navigator.msMaxTouchPoints);
}
var touchDevice = isTouchDevice();

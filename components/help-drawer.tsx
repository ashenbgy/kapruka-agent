"use client";

/**
 * A simple help and FAQ drawer to assist users when they need human support
 * or quick answers about common actions. This drawer appears from the right
 * side of the viewport when `open` is true and closes when the user clicks
 * the close button. Content is intentionally concise and can be expanded
 * further as needed.
 */
export function HelpDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-zinc-950 p-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Help & Support ❓</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="mt-6 space-y-6 text-sm text-zinc-300">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">FAQs</h3>
            <ul className="space-y-3">
              <li>
                <strong>How do I track my order?</strong>
                <p className="mt-1">You can ask &quot;Track my order&quot; in the chat or click the order tracking icon in the chat composer. You’ll be asked for your order number and email or phone.</p>
              </li>
              <li>
                <strong>What payment methods are accepted?</strong>
                <p className="mt-1">Kapruka accepts major credit and debit cards as well as bank transfers via the secure pay link. Mobile wallets are also supported for select banks.</p>
              </li>
              <li>
                <strong>Can I change my delivery date?</strong>
                <p className="mt-1">Yes, before final checkout you can adjust the delivery date on the delivery step. After placing the order, please contact Kapruka support via their hotline to make changes.</p>
              </li>
              <li>
                <strong>Need more help?</strong>
                <p className="mt-1">Chat with a live agent on Kapruka.com during business hours or call the Kapruka hotline at <a href="tel:+94112299779" className="text-emerald-400 underline">+94 11 229 9779</a>.</p>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Tips</h3>
            <ul className="space-y-3">
              <li>Use the cart 🛒 icon to review your gift box and check out.</li>
              <li>Save favourites using the star ⭐ on product cards; find them later in the wishlist.</li>
              <li>Click the surprise 🎲 quick prompt for random gift inspiration.</li>
              <li>Turn on voice input (🎤) and voice output (🔊) for a hands‑free experience.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
export default function DonateButton() {
  return (
    <form
      action="https://www.paypal.com/donate"
      method="post"
      target="_top"
      className="inline-block"
    >
      <input type="hidden" name="hosted_button_id" value="QLVQDRKWM4A7N" />
      <button type="submit" className="oriel-donate-button">
        Support the Archive
      </button>
      <img
        alt="PayPal tracking pixel"
        src="https://www.paypal.com/en_US/i/scr/pixel.gif"
        width={1}
        height={1}
        style={{ display: "none" }}
      />
    </form>
  );
}

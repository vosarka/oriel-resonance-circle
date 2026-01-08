export default function DonateButton() {
  return (
    <form action="https://www.paypal.com/donate" method="post" target="_top" className="inline-block">
      <input type="hidden" name="hosted_button_id" value="QLVQDRKWM4A7N" />
      <input 
        type="image" 
        src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" 
        name="submit" 
        title="PayPal - The safer, easier way to pay online!" 
        alt="Donate with PayPal button"
        className="hover:opacity-80 transition-opacity cursor-pointer"
        style={{ border: 'none' }}
      />
      <img 
        alt="PayPal tracking pixel" 
        src="https://www.paypal.com/en_US/i/scr/pixel.gif" 
        width={1} 
        height={1} 
        style={{ display: 'none' }}
      />
    </form>
  );
}

const faqs = [
  { q: "Do I need a credit card to start?", a: "No. BC Digital is designed so businesses can try BC Fleet before paying." },
  { q: "Can each company use its own logo?", a: "Yes. Company workspaces are designed to support custom branding, logos, and employee accounts." },
  { q: "Can I import my existing data?", a: "Yes. BC Fleet is being built with CSV imports for customers, assets, parts, and more." },
  { q: "Will this work on phones?", a: "Yes. BC Fleet is built for phone workflows like check-in, checkout, photos, repairs, and scanning tags." },
];

export default function FAQ() {
  return (
    <section className="section compact" id="faq">
      <div className="sectionHeader">
        <span>FAQ</span>
        <h2>Built to be easy to try.</h2>
      </div>

      <div className="faqGrid">
        {faqs.map((faq) => (
          <article className="faqCard" key={faq.q}>
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

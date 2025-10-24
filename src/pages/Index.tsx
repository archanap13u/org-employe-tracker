// Update this page (the content is just a fallback if you fail to update the page)

// Ensure the root page renders the login/log page for all visitors.
// Replace <Login /> below with your actual login component (or keep existing).
export default function Home() {
  return (
    <main>
      {/* Always show the login page at root */}
      <Login /> {/* ...existing login component... */}
    </main>
  );
}

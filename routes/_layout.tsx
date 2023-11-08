import { defineLayout } from "$fresh/server.ts";
import Footer from "../components/Footer.tsx";
import Header from "../components/Header.tsx";

export default defineLayout((_req, { Component }) => {
  return (
    <>
      <Header />
      <main>
        <Component />
      </main>
      <Footer />
    </>
  );
});

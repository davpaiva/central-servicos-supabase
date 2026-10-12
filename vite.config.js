// ============================================================
// vite.config.js — CONFIGURAÇÃO DO VITE
// ============================================================
// O Vite monta o React (traduz o JSX para JavaScript comum) e gera
// a versão final na pasta dist/. No GitHub, quem roda o Vite é o
// GitHub Actions (arquivo .github/workflows/publicar.yml).
// ============================================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // "./" = endereços relativos. Necessário porque o GitHub Pages publica
  // o site numa subpasta: https://seu-usuario.github.io/nome-do-repositorio/
  base: "./",
});

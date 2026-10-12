// ============================================================
// supabase.js — A LIGAÇÃO COM O SUPABASE
// ============================================================
// Cria o "cliente" do Supabase: o objeto que faz login e lê os
// dados do banco. Ele precisa de duas informações do seu projeto
// no Supabase (Settings > API Keys):
//
//   VITE_SUPABASE_URL              -> endereço do projeto
//   VITE_SUPABASE_PUBLISHABLE_KEY  -> chave pública (sb_publishable_...)
//
// Elas NÃO ficam escritas aqui. No GitHub, ficam em
// Settings > Secrets and variables > Actions > Variables, e o
// GitHub as coloca no site na hora de montar.
//
// A chave publicável pode aparecer no site sem problema: ela não
// dá acesso a nada sozinha. Quem protege os dados são as regras
// (RLS) que o arquivo supabase/01-estrutura.sql criou no banco.
// Nunca use aqui a chave secreta (sb_secret_...).
// ============================================================

import { createClient } from "@supabase/supabase-js";

const endereco = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// false = as duas informações não foram configuradas
export const configurado = Boolean(endereco && chave);

export const supabase = configurado ? createClient(endereco, chave) : null;

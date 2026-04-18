import { tool } from "langchain";
import { z } from "zod";
import {
  searchByDomain,
  searchByEmail,
  searchByIp,
  searchByUsername,
  urlsByDomain,
} from "./client.js";

const HR_NOTE =
  "Hudson Rock Community API: Infostealer-infection signals (~50 req/10s). No API key in public docs—respect rate limits and law; handle results as sensitive; not confirmation of compromise by itself.";

export function createHudsonRockTools() {
  const hudsonrockSearchByEmail = tool(
    async (input: { email: string }) => {
      return await searchByEmail(input.email);
    },
    {
      name: "hudsonrock_search_by_email",
      description: `${HR_NOTE} Check if an email may appear in stealer-related data (GET search-by-email).`,
      schema: z.object({
        email: z.string().min(3).max(320).describe("Email address to query"),
      }),
    },
  );

  const hudsonrockSearchByUsername = tool(
    async (input: { username: string }) => {
      return await searchByUsername(input.username);
    },
    {
      name: "hudsonrock_search_by_username",
      description: `${HR_NOTE} Check if a username may appear in stealer-related data (GET search-by-username).`,
      schema: z.object({
        username: z.string().min(1).max(200).describe("Username to query"),
      }),
    },
  );

  const hudsonrockSearchByDomain = tool(
    async (input: { domain: string }) => {
      return await searchByDomain(input.domain);
    },
    {
      name: "hudsonrock_search_by_domain",
      description: `${HR_NOTE} Infostealer impact signals for a domain (GET search-by-domain).`,
      schema: z.object({
        domain: z.string().min(3).max(253).describe("Domain name, e.g. example.com"),
      }),
    },
  );

  const hudsonrockUrlsByDomain = tool(
    async (input: { domain: string }) => {
      return await urlsByDomain(input.domain);
    },
    {
      name: "hudsonrock_urls_by_domain",
      description: `${HR_NOTE} External URL exposure hints derived from infostealer context for a domain (GET urls-by-domain).`,
      schema: z.object({
        domain: z.string().min(3).max(253).describe("Domain name, e.g. example.com"),
      }),
    },
  );

  const hudsonrockSearchByIp = tool(
    async (input: { ip: string }) => {
      return await searchByIp(input.ip);
    },
    {
      name: "hudsonrock_search_by_ip",
      description: `${HR_NOTE} Check if an IP may be associated with infostealer infection signals (GET search-by-ip).`,
      schema: z.object({
        ip: z.string().min(3).max(45).describe("IPv4 or IPv6 address"),
      }),
    },
  );

  return [
    hudsonrockSearchByEmail,
    hudsonrockSearchByUsername,
    hudsonrockSearchByDomain,
    hudsonrockUrlsByDomain,
    hudsonrockSearchByIp,
  ] as const;
}

export interface ParsedQuery {
  itemName: string;
  restaurantName?: string;
  quantity: number;
}

const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/^[\s,.-]+|[\s,.-]+$/g, "");

/** Deterministic parse of "2 chicken biryani from SS Hyderabad Biryani". */
export function parseQuery(input: string): ParsedQuery | null {
  let text = tidy(input);
  if (!text) return null;
  let quantity = 1;
  const lead = /^(\d{1,2})\s*x?\s+(.+)$/i.exec(text);
  const trail = /^(.+?)\s*[x×]\s*(\d{1,2})$/i.exec(text);
  if (lead) {
    quantity = Number.parseInt(lead[1]!, 10);
    text = lead[2]!;
  } else if (trail) {
    quantity = Number.parseInt(trail[2]!, 10);
    text = trail[1]!;
  }
  quantity = Math.min(Math.max(quantity, 1), 20);
  const split = /^(.+?)\s+(?:from|at|@)\s+(.+)$/i.exec(text);
  const itemName = tidy(split ? split[1]! : text);
  const restaurantName = split ? tidy(split[2]!) : undefined;
  if (!itemName) return null;
  return { itemName, restaurantName: restaurantName || undefined, quantity };
}

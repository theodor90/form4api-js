// Stage 5c (node16 only): the same type check through the CJS ("require") condition,
// which resolves to dist/index.d.cts instead of dist/index.d.ts.
import { Form4ApiClient, type CongressTradeDto, type Transaction } from "form4api";

const client = new Form4ApiClient({ apiKey: "x" });

export async function recent(): Promise<Transaction[]> {
  return client.transactions.list({ ticker: "AAPL", perPage: 5 });
}

export function lag(row: CongressTradeDto): number {
  const maybe: number | null = row.disclosureLagDays;
  // @ts-expect-error a nullable field must NOT be assignable to number
  const asNumber: number = row.disclosureLagDays;
  void asNumber;
  return maybe ?? -1;
}

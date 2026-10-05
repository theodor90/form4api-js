// Stage 5c: type-level consumer (ESM resolution under node16, plain under bundler).
// Never executed, only type-checked with `tsc --noEmit`.
import { Form4ApiClient, type CongressTradeDto, type Transaction } from "form4api";

const client = new Form4ApiClient({ apiKey: "x" });

// A typed call.
export async function recent(): Promise<Transaction[]> {
  return client.transactions.list({ ticker: "AAPL", perPage: 5 });
}

// disclosureLagDays is number | null since 1.7.0.
export function lag(row: CongressTradeDto): number {
  const maybe: number | null = row.disclosureLagDays;
  // @ts-expect-error a nullable field must NOT be assignable to number
  const asNumber: number = row.disclosureLagDays;
  void asNumber;
  return maybe ?? -1;
}

export async function congress(): Promise<Array<number | null>> {
  const rows: CongressTradeDto[] = await client.congress.trades({ ticker: "SONY" });
  return rows.map((r) => r.disclosureLagDays);
}

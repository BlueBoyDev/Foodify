import { api } from "./api/axios";

export interface Table {
  id: string;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  restaurantId: string;
}

export async function getTablesApi(): Promise<Table[]> {
  try {
    const { data } = await api.get("/tables");
    const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
    return list.map((t: any) => ({
      ...t,
      id: String(t.id),
      number: String(t.number),
      seats: Number(t.seats),
    }));
  } catch (e) {
    console.error("Error fetching tables:", e);
    throw e;
  }
}

export async function createTableApi(payload: { number: string; seats: number }): Promise<Table> {
  const { data } = await api.post("/tables", payload);
  const t = data.data;
  return {
    ...t,
    id: String(t.id),
    number: String(t.number),
    seats: Number(t.seats),
  };
}

export async function updateTableStatusApi(id: string, status: string): Promise<Table> {
  const { data } = await api.patch(`/tables/${id}/status`, { status });
  const t = data.data;
  return {
    ...t,
    id: String(t.id),
    number: String(t.number),
    seats: Number(t.seats),
  };
}

export async function removeTableApi(id: string): Promise<void> {
  await api.delete(`/tables/${id}`);
}

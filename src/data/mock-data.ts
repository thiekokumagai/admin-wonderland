// ========== TYPES ==========
export interface Category {
  id: string;
  nome: string;
  ordem: number;
  status: boolean;
}

export interface Product {
  id: string;
  descricao: string;
  preco: number;
  categoria: string;
  status: boolean;
  detalhes: string;
  imagens: string[];
  videoYoutube: string;
}

export interface Order {
  id: string;
  cliente: string;
  produtos: { nome: string; qtd: number; preco: number }[];
  total: number;
  pagamento: string;
  status: "pendente" | "preparo" | "entrega" | "finalizado";
  data: string;
}

export interface Coupon {
  id: string;
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  status: boolean;
}

export interface DeliveryRange {
  id: string;
  distancia: number;
  valor: number;
}

export interface Installment {
  id: string;
  parcelas: number;
  juros: number;
}

export interface CashEntry {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
}

export interface BusinessHour {
  dia: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

export interface Settings {
  logo: string;
  banner: string;
  whatsapp: string;
  instagram: string;
  endereco: string;
  ocultarEndereco: boolean;
  lojaAberta: boolean;
  lojaSuspensa: boolean;
  horarios: BusinessHour[];
  pixKey: string;
  enderecoOrigem: string;
}

// ========== MOCK DATA ==========

export const mockCategories: Category[] = [
  { id: "1", nome: "Lanches", ordem: 1, status: true },
  { id: "2", nome: "Bebidas", ordem: 2, status: true },
  { id: "3", nome: "Sobremesas", ordem: 3, status: true },
  { id: "4", nome: "Combos", ordem: 4, status: false },
];

export const mockProducts: Product[] = [
  { id: "1", descricao: "X-Burger Especial", preco: 28.9, categoria: "1", status: true, detalhes: "Pão brioche, hambúrguer 180g, queijo cheddar, bacon crocante, alface e tomate", imagens: [], videoYoutube: "" },
  { id: "2", descricao: "Coca-Cola 350ml", preco: 6.5, categoria: "2", status: true, detalhes: "Coca-Cola lata gelada", imagens: [], videoYoutube: "" },
  { id: "3", descricao: "Brownie com Sorvete", preco: 18.0, categoria: "3", status: true, detalhes: "Brownie de chocolate com sorvete de baunilha", imagens: [], videoYoutube: "" },
  { id: "4", descricao: "Combo Família", preco: 89.9, categoria: "4", status: false, detalhes: "4 lanches + 4 bebidas + 2 sobremesas", imagens: [], videoYoutube: "" },
  { id: "5", descricao: "Batata Frita P", preco: 12.0, categoria: "1", status: true, detalhes: "Porção pequena de batata frita crocante", imagens: [], videoYoutube: "" },
];

export const mockOrders: Order[] = [
  { id: "1001", cliente: "João Silva", produtos: [{ nome: "X-Burger Especial", qtd: 2, preco: 28.9 }, { nome: "Coca-Cola 350ml", qtd: 2, preco: 6.5 }], total: 70.8, pagamento: "PIX", status: "pendente", data: "2026-03-25 14:30" },
  { id: "1002", cliente: "Maria Santos", produtos: [{ nome: "Brownie com Sorvete", qtd: 1, preco: 18.0 }], total: 18.0, pagamento: "Cartão", status: "preparo", data: "2026-03-25 14:15" },
  { id: "1003", cliente: "Carlos Oliveira", produtos: [{ nome: "Combo Família", qtd: 1, preco: 89.9 }, { nome: "Batata Frita P", qtd: 2, preco: 12.0 }], total: 113.9, pagamento: "Dinheiro", status: "entrega", data: "2026-03-25 13:45" },
  { id: "1004", cliente: "Ana Lima", produtos: [{ nome: "X-Burger Especial", qtd: 1, preco: 28.9 }], total: 28.9, pagamento: "PIX", status: "finalizado", data: "2026-03-25 12:00" },
  { id: "1005", cliente: "Pedro Costa", produtos: [{ nome: "Coca-Cola 350ml", qtd: 3, preco: 6.5 }, { nome: "Batata Frita P", qtd: 1, preco: 12.0 }], total: 31.5, pagamento: "Cartão", status: "pendente", data: "2026-03-25 15:00" },
];

export const mockCoupons: Coupon[] = [
  { id: "1", codigo: "PROMO10", tipo: "percentual", valor: 10, status: true },
  { id: "2", codigo: "FRETE5", tipo: "fixo", valor: 5, status: true },
  { id: "3", codigo: "WELCOME20", tipo: "percentual", valor: 20, status: false },
];

export const mockDeliveryRanges: DeliveryRange[] = [
  { id: "1", distancia: 3, valor: 5.0 },
  { id: "2", distancia: 6, valor: 8.0 },
  { id: "3", distancia: 10, valor: 12.0 },
  { id: "4", distancia: 15, valor: 18.0 },
];

export const mockInstallments: Installment[] = [
  { id: "1", parcelas: 1, juros: 0 },
  { id: "2", parcelas: 2, juros: 0 },
  { id: "3", parcelas: 3, juros: 2.5 },
  { id: "4", parcelas: 6, juros: 4.9 },
  { id: "5", parcelas: 12, juros: 9.9 },
];

export const mockCashEntries: CashEntry[] = [
  { id: "1", tipo: "entrada", descricao: "Pedido #1001", valor: 70.8, data: "2026-03-25 14:30" },
  { id: "2", tipo: "entrada", descricao: "Pedido #1004", valor: 28.9, data: "2026-03-25 12:00" },
  { id: "3", tipo: "saida", descricao: "Troco fornecedor", valor: 50.0, data: "2026-03-25 11:00" },
  { id: "4", tipo: "entrada", descricao: "Pedido #1002", valor: 18.0, data: "2026-03-25 14:15" },
];

export const mockSettings: Settings = {
  logo: "",
  banner: "",
  whatsapp: "(11) 99999-9999",
  instagram: "@meunegocio",
  endereco: "Rua Exemplo, 123 - Centro",
  ocultarEndereco: false,
  lojaAberta: true,
  lojaSuspensa: false,
  horarios: [
    { dia: "Segunda", ativo: true, abertura: "08:00", fechamento: "22:00" },
    { dia: "Terça", ativo: true, abertura: "08:00", fechamento: "22:00" },
    { dia: "Quarta", ativo: true, abertura: "08:00", fechamento: "22:00" },
    { dia: "Quinta", ativo: true, abertura: "08:00", fechamento: "22:00" },
    { dia: "Sexta", ativo: true, abertura: "08:00", fechamento: "23:00" },
    { dia: "Sábado", ativo: true, abertura: "10:00", fechamento: "23:00" },
    { dia: "Domingo", ativo: false, abertura: "10:00", fechamento: "20:00" },
  ],
  pixKey: "meunegocio@email.com",
  enderecoOrigem: "Rua Exemplo, 123 - Centro",
};

// ========== DASHBOARD STATS ==========
export const dashboardStats = {
  totalVendas: 12450.0,
  pedidosDia: 23,
  pedidosMes: 487,
  ticketMedio: 45.6,
  chartData: [
    { name: "Seg", vendas: 1200 },
    { name: "Ter", vendas: 1800 },
    { name: "Qua", vendas: 1400 },
    { name: "Qui", vendas: 2200 },
    { name: "Sex", vendas: 2800 },
    { name: "Sáb", vendas: 3100 },
    { name: "Dom", vendas: 1950 },
  ],
};

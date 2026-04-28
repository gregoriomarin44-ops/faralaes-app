import trajeCoral from "@/assets/product-traje-coral.jpg";
import trajeVerde from "@/assets/product-traje-verde.jpg";
import manton from "@/assets/product-manton.jpg";
import falda from "@/assets/product-falda.jpg";
import flor from "@/assets/product-flor.jpg";
import zapatos from "@/assets/product-zapatos.jpg";
import pendientes from "@/assets/product-pendientes.jpg";
import blusa from "@/assets/product-blusa.jpg";

export type Product = {
  id: string;
  nombre: string;
  precio: number;
  talla: string;
  estado: "Nuevo" | "Como nuevo" | "Buen estado";
  ubicacion: string;
  categoria: string;
  color: string;
  imagen: string;
  descripcion: string;
};

export const products: Product[] = [
  { id: "1", nombre: "Traje de flamenca granate con lunares", precio: 220, talla: "38", estado: "Como nuevo", ubicacion: "Sevilla", categoria: "Trajes de flamenca", color: "Granate", imagen: trajeCoral, descripcion: "Estrenado una sola Feria de Abril. Confeccionado a medida en taller sevillano." },
  { id: "2", nombre: "Mantón de Manila bordado a mano", precio: 380, talla: "Única", estado: "Buen estado", ubicacion: "Jerez", categoria: "Mantones", color: "Marfil", imagen: manton, descripcion: "Mantón heredado, bordado floral en seda. Flecos en perfecto estado." },
  { id: "3", nombre: "Falda de ensayo lunares blancos", precio: 65, talla: "M", estado: "Buen estado", ubicacion: "Dos Hermanas", categoria: "Faldas", color: "Negro", imagen: falda, descripcion: "Ideal para clases de baile. Cuatro volantes, mucho vuelo." },
  { id: "4", nombre: "Flor de tela grande roja", precio: 18, talla: "Única", estado: "Nuevo", ubicacion: "Sevilla", categoria: "Flores", color: "Rojo", imagen: flor, descripcion: "Flor artesanal sin estrenar, con peineta incorporada." },
  { id: "5", nombre: "Zapatos de baile profesionales", precio: 95, talla: "37", estado: "Como nuevo", ubicacion: "Huelva", categoria: "Zapatos", color: "Negro", imagen: zapatos, descripcion: "Zapatos de tablao con clavos. Apenas usados dos meses." },
  { id: "6", nombre: "Pendientes coral filigrana", precio: 45, talla: "Única", estado: "Nuevo", ubicacion: "Sevilla", categoria: "Pendientes", color: "Coral", imagen: pendientes, descripcion: "Pendientes largos de filigrana dorada con detalles de coral." },
  { id: "7", nombre: "Traje verde lunar blanco", precio: 280, talla: "40", estado: "Buen estado", ubicacion: "Jerez", categoria: "Trajes de flamenca", color: "Verde", imagen: trajeVerde, descripcion: "Traje canastero clásico, escote bardot. Una sola temporada." },
  { id: "8", nombre: "Blusa blanca volantes", precio: 38, talla: "S", estado: "Como nuevo", ubicacion: "Dos Hermanas", categoria: "Blusas", color: "Blanco", imagen: blusa, descripcion: "Blusa romántica con volantes, ideal para combinar con falda de ensayo." },
];

export const categorias = ["Todas", "Trajes de flamenca", "Faldas", "Blusas", "Mantones", "Flores", "Pendientes", "Zapatos", "Complementos"];
export const tallas = ["Todas", "XS", "S", "M", "L", "XL", "36", "38", "40", "42", "Única"];
export const estados = ["Todos", "Nuevo", "Como nuevo", "Buen estado"];
export const colores = ["Todos", "Rojo", "Granate", "Coral", "Verde", "Negro", "Blanco", "Marfil"];
export const rangosPrecio = ["Todos", "Hasta 50€", "50€ - 150€", "150€ - 300€", "Más de 300€"];

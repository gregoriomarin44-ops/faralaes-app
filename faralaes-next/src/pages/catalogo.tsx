import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { ParsedUrlQueryInput } from "querystring";
import Head from "next/head";
import NavBar from "../components/NavBar";
import ListingCard from "../components/ListingCard";
import { getCanonical } from "../lib/seo";
import { getOperationLabel, normalizeOperationType } from "../lib/listingOperation";
import {
  categoryOptions,
  conditionOptions,
  formatAttributeValue,
  getCategoryLabel,
  getCategoryAttributeSchema,
  getConditionLabel,
  normalizeAttributesForCategory,
} from "../lib/listingOptions";

type Producto = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  operationType?: string | null;
  category: string;
  size: string | null;
  color: string | null;
  brand: string | null;
  usage: string | null;
  location: string | null;
  condition: string | null;
  attributes: Record<string, string | number | boolean> | null;
  shippingAvailable: boolean;
  whatsappContactAllowed: boolean;
  images?: {
    url: string;
  }[];
};

type CatalogDisplayState = {
  productosFiltrados: Producto[];
  ultimosAnuncios: Producto[];
  puedeInteresarteFinal: Producto[];
  totalProductos: number;
};

const precioAcentimos = (valor: string) => {
  if (!valor.trim()) return null;

  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return Math.round(numero * 100);
};

const hasDynamicSizeField = (
  schema: ReturnType<typeof getCategoryAttributeSchema>
) => schema.some((field) => ["talla", "talla_edad", "numero"].includes(field.key));

const hasDynamicColorField = (
  schema: ReturnType<typeof getCategoryAttributeSchema>
) => schema.some((field) => field.key === "color");

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFavoritos, setProductosFavoritos] = useState<Producto[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [estado, setEstado] = useState("todos");
  const [operationType, setOperationType] = useState("todos");
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloWhatsapp, setSoloWhatsapp] = useState(false);
  const [soloEnvio, setSoloEnvio] = useState(false);
  const [orden, setOrden] = useState("recientes");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const activeCategory =
    router.isReady && typeof router.query.categoria === "string"
      ? router.query.categoria
      : "";
  const categoryFilterValue = activeCategory || "todas";

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        const productosRes = await fetch("/api/productos");
        const productosData = productosRes.ok ? await productosRes.json() : [];
        setProductos(Array.isArray(productosData) ? productosData : []);

        const meRes = await fetch("/api/me");

        if (meRes.ok) {
          const user = await meRes.json();
          setUserId(user.id);

          const favoritosRes = await fetch("/api/favoritos");

          if (!favoritosRes.ok) return;

          const favoritosData = await favoritosRes.json();
          const favoritosArray: Producto[] = Array.isArray(favoritosData)
            ? favoritosData
            : [];
          setProductosFavoritos(favoritosArray);
          setFavoritos(favoritosArray.map((producto) => producto.id));
        }
      } catch (error) {
        console.error("No se ha podido cargar el catálogo.", error);
        setProductos([]);
        setProductosFavoritos([]);
        setFavoritos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarCatalogo();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const queryBusqueda = router.query.q;

    setBusqueda(typeof queryBusqueda === "string" ? queryBusqueda : "");
  }, [router.isReady, router.query.q]);

  useEffect(() => {
    if (!router.isReady) return;

    const nextQuery: ParsedUrlQueryInput = {
      ...router.query,
      ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
    };

    if (!busqueda.trim()) {
      delete nextQuery.q;
    }

    const nextQ = typeof nextQuery.q === "string" ? nextQuery.q : "";
    const currentQ = typeof router.query.q === "string" ? router.query.q : "";

    if (nextQ === currentQ) {
      return;
    }

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  }, [busqueda, router, router.isReady]);

  useEffect(() => {
    if (!filtersOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filtersOpen]);

  const abrirProducto = (producto: Producto) => {
    if (userId && producto.sellerId === userId) {
      router.push(`/editar/${producto.id}`);
      return;
    }

    router.push(`/producto/${producto.id}`);
  };

  const toggleFavorito = async (
    e: React.MouseEvent<HTMLButtonElement>,
    listingId: string
  ) => {
    e.stopPropagation();

    if (!userId) {
      router.push("/login");
      return;
    }

    const estaGuardado = favoritos.includes(listingId);

    setFavoritos((prev) =>
      estaGuardado
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );

    const res = await fetch("/api/favoritos", {
      method: estaGuardado ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    if (!res.ok) {
      setFavoritos((prev) =>
        estaGuardado
          ? [...prev, listingId]
          : prev.filter((id) => id !== listingId)
      );

      if (res.status === 401) {
        router.push("/login");
      }
    }
  };

  const enviarMensaje = async (
    event: React.MouseEvent<HTMLButtonElement>,
    producto: Producto
  ) => {
    event.stopPropagation();

    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(`/producto/${producto.id}`)}`);
      return;
    }

    if (producto.sellerId === userId) {
      router.push(`/editar/${producto.id}`);
      return;
    }

    const res = await fetch("/api/conversaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: producto.id }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/producto/${producto.id}`)}`);
      }

      return;
    }

    const conversacion = await res.json();
    router.push(`/mensajes?conversationId=${conversacion.id}`);
  };

  const clearFilters = () => {
    setBusqueda("");
    setUbicacion("");
    setTalla("");
    setColor("");
    setEstado("todos");
    setOperationType("todos");
    setAttributeFilters({});
    setPrecioMin("");
    setPrecioMax("");
    setSoloWhatsapp(false);
    setSoloEnvio(false);
    router.push(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  };

  const selectedAttributeSchema = useMemo(
    () =>
      !router.isReady || !activeCategory
        ? []
        : getCategoryAttributeSchema(activeCategory).filter((field) => field.filterable),
    [activeCategory, router.isReady]
  );
  const hidesGeneralSizeFilter = hasDynamicSizeField(selectedAttributeSchema);
  const hidesGeneralColorFilter = hasDynamicColorField(selectedAttributeSchema);

  const activeFilterCount = [
    Boolean(busqueda.trim()),
    Boolean(activeCategory),
    Boolean(ubicacion.trim()),
    !hidesGeneralSizeFilter && Boolean(talla.trim()),
    !hidesGeneralColorFilter && Boolean(color.trim()),
    estado !== "todos",
    operationType !== "todos",
    ...Object.values(attributeFilters).map((value) => Boolean(value)),
    Boolean(precioMin.trim()),
    Boolean(precioMax.trim()),
    soloWhatsapp,
    soloEnvio,
  ].filter(Boolean).length;

  const setCategoryFilter = (value: string) => {
    const nextQuery: ParsedUrlQueryInput = {
      ...router.query,
      ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
    };

    if (value === "todas") {
      delete nextQuery.categoria;
    } else {
      nextQuery.categoria = value;
    }

    if (!busqueda.trim()) {
      delete nextQuery.q;
    }

    router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const setAttributeFilter = (key: string, value: string) => {
    setAttributeFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const removeAttributeFilter = (key: string) => {
    setAttributeFilters((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const dynamicFilterControls =
    selectedAttributeSchema.length > 0
      ? selectedAttributeSchema.map((field) => {
          const value = attributeFilters[field.key] || "";

          if (field.type === "boolean") {
            return (
              <select
                key={field.key}
                className="h-12 rounded border border-gray-300 px-3"
                value={value}
                onChange={(e) => setAttributeFilter(field.key, e.target.value)}
              >
                <option value="">{field.label}</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            );
          }

          if (field.type === "select") {
            return (
              <select
                key={field.key}
                className="h-12 rounded border border-gray-300 px-3"
                value={value}
                onChange={(e) => setAttributeFilter(field.key, e.target.value)}
              >
                <option value="">{field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }

          return (
            <input
              key={field.key}
              className="h-12 rounded border border-gray-300 px-3"
              value={value}
              onChange={(e) => setAttributeFilter(field.key, e.target.value)}
              placeholder={field.label}
              type={field.type === "number" ? "number" : "text"}
            />
          );
        })
      : null;

  const filterControls = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <input
        className="h-12 rounded border border-gray-300 px-3"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por título o descripción"
      />
      <select
        className="h-12 rounded border border-gray-300 px-3"
        value={categoryFilterValue}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="todas">Todas las categorías</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {dynamicFilterControls}
      <input
        className="h-12 rounded border border-gray-300 px-3"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
        placeholder="Ubicación"
      />
      {!hidesGeneralSizeFilter && (
        <input
          className="h-12 rounded border border-gray-300 px-3"
          value={talla}
          onChange={(e) => setTalla(e.target.value)}
          placeholder="Talla"
        />
      )}
      {!hidesGeneralColorFilter && (
        <input
          className="h-12 rounded border border-gray-300 px-3"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Color"
        />
      )}
      <select
        className="h-12 rounded border border-gray-300 px-3"
        value={operationType}
        onChange={(e) => setOperationType(e.target.value)}
      >
        <option value="todos">Todos</option>
        <option value="sale">Venta</option>
        <option value="donation">Regalo / donación</option>
      </select>
      <select
        className="h-12 rounded border border-gray-300 px-3"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      >
        <option value="todos">Todos los estados</option>
        {conditionOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        className="h-12 rounded border border-gray-300 px-3"
        value={precioMin}
        onChange={(e) => setPrecioMin(e.target.value)}
        placeholder="Precio mínimo"
        type="text"
        inputMode="decimal"
      />
      <input
        className="h-12 rounded border border-gray-300 px-3"
        value={precioMax}
        onChange={(e) => setPrecioMax(e.target.value)}
        placeholder="Precio máximo"
        type="text"
        inputMode="decimal"
      />
      <select
        className="hidden h-12 rounded border border-gray-300 px-3 md:block"
        value={orden}
        onChange={(e) => setOrden(e.target.value)}
      >
        <option value="recientes">Más recientes</option>
        <option value="precio-asc">Precio menor</option>
        <option value="precio-desc">Precio mayor</option>
      </select>
      <div className="flex flex-col justify-center gap-2 rounded border border-gray-200 p-3 md:col-span-2 lg:col-span-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={soloWhatsapp}
            onChange={(e) => setSoloWhatsapp(e.target.checked)}
          />
          Solo con WhatsApp permitido
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={soloEnvio}
            onChange={(e) => setSoloEnvio(e.target.checked)}
          />
          Solo con envío disponible
        </label>
      </div>
    </div>
  );

  const mobileFilterControls = (
    <div className="space-y-4">
      <input
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por título o descripción"
      />
      <select
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={categoryFilterValue}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="todas">Todas las categorías</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="h-12 rounded border border-gray-300 px-3"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
          placeholder="Precio mínimo"
          type="text"
          inputMode="decimal"
        />
        <input
          className="h-12 rounded border border-gray-300 px-3"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          placeholder="Precio máximo"
          type="text"
          inputMode="decimal"
        />
      </div>
      <input
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
        placeholder="Ubicación"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dynamicFilterControls}
      </div>
      {(!hidesGeneralSizeFilter || !hidesGeneralColorFilter) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!hidesGeneralSizeFilter && (
            <input
              className="h-12 rounded border border-gray-300 px-3"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              placeholder="Talla"
            />
          )}
          {!hidesGeneralColorFilter && (
            <input
              className="h-12 rounded border border-gray-300 px-3"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Color"
            />
          )}
        </div>
      )}
      <select
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={operationType}
        onChange={(e) => setOperationType(e.target.value)}
      >
        <option value="todos">Todos</option>
        <option value="sale">Venta</option>
        <option value="donation">Regalo / donación</option>
      </select>
      <select
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      >
        <option value="todos">Todos los estados</option>
        {conditionOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="h-12 w-full rounded border border-gray-300 px-3"
        value={orden}
        onChange={(e) => setOrden(e.target.value)}
      >
        <option value="recientes">Más recientes</option>
        <option value="precio-asc">Precio menor</option>
        <option value="precio-desc">Precio mayor</option>
      </select>
      <div className="space-y-2 rounded border border-gray-200 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={soloWhatsapp}
            onChange={(e) => setSoloWhatsapp(e.target.checked)}
          />
          Solo con WhatsApp permitido
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={soloEnvio}
            onChange={(e) => setSoloEnvio(e.target.checked)}
          />
          Solo con envío disponible
        </label>
      </div>
    </div>
  );

  const renderSkeletonCards = () => (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          key={index}
          className="min-w-[230px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:min-w-0"
        >
          <div className="skeleton aspect-[3/4] bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-5 w-4/5 rounded-full" />
            <div className="skeleton h-4 w-3/5 rounded-full" />
            <div className="skeleton h-7 w-1/2 rounded-full" />
            <div className="flex gap-2">
              <div className="skeleton h-7 w-16 rounded-full" />
              <div className="skeleton h-7 w-20 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const renderEmptyResults = () => (
    <div className="mt-5 flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/70 px-6 text-center sm:min-h-[520px] lg:min-h-[560px]">
      <div>
        <p className="font-serif text-2xl text-gray-950">
          No hay anuncios publicados en esta categoría todavía.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Prueba con otra categoría o limpia filtros para ver más resultados.
        </p>
      </div>
    </div>
  );

  const renderProductGrid = (items: Producto[]) => (
    <div className="mt-5 -mx-4 flex min-h-[420px] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:min-h-[520px] sm:grid-cols-2 sm:px-0 lg:min-h-[560px] lg:grid-cols-4">
      {items.map((producto) => (
        <div key={producto.id} className="min-w-[230px] sm:min-w-0">
          {renderProductoCard(producto)}
        </div>
      ))}
    </div>
  );

  const renderProductoCard = (p: Producto) => (
    <ListingCard
      key={p.id}
      listing={p}
      isFavorite={favoritos.includes(p.id)}
      isOwnListing={Boolean(userId && p.sellerId === userId)}
      onClick={() => abrirProducto(p)}
      onFavoriteClick={(event) => toggleFavorito(event, p.id)}
      onMessageClick={(event) => enviarMensaje(event, p)}
    />
  );

  const precioMinCents = precioAcentimos(precioMin);
  const precioMaxCents = precioAcentimos(precioMax);
  const catalogReady = !loading && router.isReady;
  const currentCatalogState = useMemo<CatalogDisplayState>(() => {
    const productosFiltrados = productos
      .filter((producto) => {
        const texto = busqueda.trim().toLowerCase();
        const coincideTexto =
          !texto ||
          producto.title.toLowerCase().includes(texto) ||
          (producto.description || "").toLowerCase().includes(texto);
        const coincideCategoria =
          !activeCategory || producto.category === activeCategory;
        const coincideUbicacion =
          !ubicacion.trim() ||
          (producto.location || "")
            .toLowerCase()
            .includes(ubicacion.trim().toLowerCase());
        const coincideTalla =
          hidesGeneralSizeFilter ||
          !talla.trim() ||
          (producto.size || "").toLowerCase().includes(talla.trim().toLowerCase());
        const coincideColor =
          hidesGeneralColorFilter ||
          !color.trim() ||
          (producto.color || "")
            .toLowerCase()
            .includes(color.trim().toLowerCase());
        const coincideEstado =
          estado === "todos" || producto.condition === estado;
        const coincideOperacion =
          operationType === "todos" ||
          normalizeOperationType(producto.operationType) === operationType;
        const productoAttributes = normalizeAttributesForCategory(
          producto.category,
          producto.attributes
        );
        const coincideAttributes =
          !activeCategory ||
          selectedAttributeSchema.every((field) => {
            const selectedValue = attributeFilters[field.key];

            if (!selectedValue) {
              return true;
            }

            const attributeValue = productoAttributes[field.key];

            if (attributeValue === undefined) {
              return false;
            }

            if (field.type === "boolean") {
              return String(attributeValue) === selectedValue;
            }

            return formatAttributeValue(field, attributeValue)
              .toLowerCase()
              .includes(selectedValue.toLowerCase());
          });
        const coincidePrecioMin =
          precioMinCents === null || producto.priceCents >= precioMinCents;
        const coincidePrecioMax =
          precioMaxCents === null || producto.priceCents <= precioMaxCents;
        const coincideWhatsapp =
          !soloWhatsapp || producto.whatsappContactAllowed;
        const coincideEnvio = !soloEnvio || producto.shippingAvailable;

        return (
          coincideTexto &&
          coincideCategoria &&
          coincideUbicacion &&
          coincideTalla &&
          coincideColor &&
          coincideEstado &&
          coincideOperacion &&
          coincideAttributes &&
          coincidePrecioMin &&
          coincidePrecioMax &&
          coincideWhatsapp &&
          coincideEnvio
        );
      })
      .sort((a, b) => {
        if (orden === "precio-asc") {
          return a.priceCents - b.priceCents;
        }

        if (orden === "precio-desc") {
          return b.priceCents - a.priceCents;
        }

        return 0;
      });
    const ultimosAnuncios = productosFiltrados.slice(0, 4);
    const idsUltimosAnuncios = new Set(
      ultimosAnuncios.map((producto) => producto.id)
    );
    const categoriasFavoritas = new Set(
      productosFavoritos.map((producto) => producto.category).filter(Boolean)
    );
    const ubicacionesFavoritas = new Set(
      productosFavoritos
        .map((producto) => producto.location?.trim().toLowerCase())
        .filter((location): location is string => Boolean(location))
    );
    const idsFavoritos = new Set(favoritos);
    const recomendacionesRelacionadas = userId
      ? productosFiltrados.filter((producto) => {
          if (
            idsUltimosAnuncios.has(producto.id) ||
            idsFavoritos.has(producto.id)
          ) {
            return false;
          }

          const mismaCategoria = categoriasFavoritas.has(producto.category);
          const mismaUbicacion = producto.location
            ? ubicacionesFavoritas.has(producto.location.trim().toLowerCase())
            : false;

          return mismaCategoria || mismaUbicacion;
        })
      : [];
    const recomendacionesFallback = productosFiltrados.filter(
      (producto) =>
        !idsUltimosAnuncios.has(producto.id) &&
        !idsFavoritos.has(producto.id) &&
        !recomendacionesRelacionadas.some(
          (recomendacion) => recomendacion.id === producto.id
        )
    );
    const puedeInteresarte = [
      ...recomendacionesRelacionadas,
      ...recomendacionesFallback,
    ];
    const idsPuedeInteresarte = new Set(
      puedeInteresarte.map((producto) => producto.id)
    );
    const rellenoConRepetidos = productosFiltrados.filter(
      (producto) => !idsPuedeInteresarte.has(producto.id)
    );
    const puedeInteresarteFinal = [
      ...puedeInteresarte,
      ...rellenoConRepetidos,
    ].slice(0, 4);

    return {
      productosFiltrados,
      ultimosAnuncios,
      puedeInteresarteFinal,
      totalProductos: productos.length,
    };
  }, [
    attributeFilters,
    busqueda,
    activeCategory,
    color,
    estado,
    favoritos,
    hidesGeneralColorFilter,
    hidesGeneralSizeFilter,
    operationType,
    orden,
    precioMaxCents,
    precioMinCents,
    productos,
    productosFavoritos,
    selectedAttributeSchema,
    soloEnvio,
    soloWhatsapp,
    talla,
    ubicacion,
    userId,
  ]);
  const visibleCatalogState = currentCatalogState;
  const productosFiltrados = visibleCatalogState.productosFiltrados;
  const ultimosAnuncios = visibleCatalogState.ultimosAnuncios;
  const puedeInteresarteFinal = visibleCatalogState.puedeInteresarteFinal;
  const visibleTotalProductos = visibleCatalogState.totalProductos;
  const activeFilterChips = [
    busqueda.trim()
      ? {
          key: "search",
          label: `Buscar: ${busqueda.trim()}`,
          onRemove: () => setBusqueda(""),
        }
      : null,
    activeCategory
      ? {
          key: "category",
          label: getCategoryLabel(activeCategory),
          onRemove: () => setCategoryFilter("todas"),
        }
      : null,
    ubicacion.trim()
      ? {
          key: "location",
          label: ubicacion.trim(),
          onRemove: () => setUbicacion(""),
        }
      : null,
    !hidesGeneralSizeFilter && talla.trim()
      ? {
          key: "size",
          label: `Talla ${talla.trim()}`,
          onRemove: () => setTalla(""),
        }
      : null,
    !hidesGeneralColorFilter && color.trim()
      ? {
          key: "color",
          label: color.trim(),
          onRemove: () => setColor(""),
        }
      : null,
    estado !== "todos"
      ? {
          key: "condition",
          label: getConditionLabel(estado),
          onRemove: () => setEstado("todos"),
        }
      : null,
    operationType !== "todos"
      ? {
          key: "operation",
          label: getOperationLabel(operationType),
          onRemove: () => setOperationType("todos"),
        }
      : null,
    precioMin.trim()
      ? {
          key: "price-min",
          label: `Desde ${precioMin.trim()} €`,
          onRemove: () => setPrecioMin(""),
        }
      : null,
    precioMax.trim()
      ? {
          key: "price-max",
          label: `Hasta ${precioMax.trim()} €`,
          onRemove: () => setPrecioMax(""),
        }
      : null,
    soloWhatsapp
      ? {
          key: "whatsapp",
          label: "WhatsApp",
          onRemove: () => setSoloWhatsapp(false),
        }
      : null,
    soloEnvio
      ? {
          key: "shipping",
          label: "Envío",
          onRemove: () => setSoloEnvio(false),
        }
      : null,
    ...selectedAttributeSchema
      .map((field) => {
        const value = attributeFilters[field.key];

        if (!value) {
          return null;
        }

        const labelValue =
          field.type === "boolean" ? (value === "true" ? "Sí" : "No") : value;

        return {
          key: `attribute-${field.key}`,
          label: `${field.label}: ${labelValue}`,
          onRemove: () => removeAttributeFilter(field.key),
        };
      })
      .filter(
        (
          chip
        ): chip is { key: string; label: string; onRemove: () => void } =>
          Boolean(chip)
      ),
  ].filter(
    (chip): chip is { key: string; label: string; onRemove: () => void } =>
      Boolean(chip)
  );

  return (
    <>
      <Head>
        <title>Catálogo de moda flamenca | Faralaes</title>
        <meta
          name="description"
          content="Explora anuncios publicados de moda flamenca de segunda mano en Faralaes."
        />
        {Object.keys(router.query).length > 0 && (
          <meta name="robots" content="noindex,follow" />
        )}
        <link rel="canonical" href={getCanonical("/catalogo")} />
      </Head>
      {filtersOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            className="motion-overlay absolute inset-0 bg-black/45"
            aria-label="Cerrar filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="motion-drawer absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-700">
                  Filtros
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Afina el catálogo sin perder velocidad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="tap-feedback flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-2xl leading-none text-gray-700"
                aria-label="Cerrar filtros"
              >
                ×
              </button>
            </div>

            {mobileFilterControls}

            <div className="sticky bottom-0 -mx-5 mt-5 flex gap-3 border-t border-gray-100 bg-white px-5 pb-1 pt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="tap-feedback h-12 flex-1 rounded-full border border-gray-300 bg-white px-4 text-sm font-bold text-gray-700"
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="tap-feedback h-12 flex-1 rounded-full bg-green-700 px-4 text-sm font-bold text-white"
              >
                Aplicar filtros
              </button>
            </div>
          </aside>
        </div>
      )}

      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-4 py-8 sm:px-6 lg:py-12">
        <section className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
          <div>
            <p className="text-sm uppercase tracking-widest text-red-700 font-semibold">
              Catálogo
            </p>

            <h1 className="text-4xl md:text-5xl font-serif mt-3 mb-3 md:mb-4">
              Compra y vende moda flamenca
            </h1>

            <p className="text-gray-600">
              {catalogReady
                ? `Mostrando ${productosFiltrados.length} de ${visibleTotalProductos} prendas publicadas.`
                : "Preparando el catálogo..."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/mis-anuncios")}
            className="tap-feedback rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Mis anuncios
          </button>
        </div>

        {catalogReady && productos.length > 0 && (
          <div className="sticky top-0 z-30 -mx-4 mb-6 border-y border-gray-200 bg-[#f8f3ef]/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="tap-feedback h-11 flex-1 rounded-full bg-stone-950 px-4 text-sm font-bold text-white"
              >
                Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className={`tap-feedback h-11 shrink-0 rounded-full border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 ${
                  activeFilterCount === 0
                    ? "pointer-events-none invisible"
                    : ""
                }`}
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {catalogReady && (
          <div className="mb-6 -mx-4 flex min-h-12 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-gutter:stable] [scrollbar-width:none] sm:mx-0 sm:min-h-[5.5rem] sm:flex-wrap sm:overflow-y-auto sm:px-0">
            {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="tap-feedback h-10 shrink-0 rounded-full border border-red-100 bg-white px-4 text-sm font-bold text-red-800 shadow-sm hover:border-red-800"
                  aria-label={`Quitar filtro ${chip.label}`}
                >
                  {chip.label} ×
                </button>
              ))}
          </div>
        )}

        {!catalogReady && (
          <div className="space-y-10">
            <section>
              <div className="skeleton h-9 w-64 rounded-full" />
              <div className="mt-5">{renderSkeletonCards()}</div>
            </section>
            <section>
              <div className="skeleton h-9 w-52 rounded-full" />
              <div className="mt-5">{renderSkeletonCards()}</div>
            </section>
          </div>
        )}

        {catalogReady && productos.length > 0 && (
          <div className="mb-8 hidden min-h-[456px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:min-h-[392px] md:block">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Filtrar catálogo
              </p>
              <button
                type="button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className={`tap-feedback rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:border-green-700 hover:text-green-700 ${
                  activeFilterCount === 0
                    ? "pointer-events-none invisible"
                    : ""
                }`}
              >
                Limpiar filtros
              </button>
            </div>
            {filterControls}
          </div>
        )}

        {catalogReady && (
          <div className="relative min-h-[900px] sm:min-h-[1120px] lg:min-h-[1180px]">
            <div className="space-y-10">
              <section className="min-h-[500px] sm:min-h-[620px] lg:min-h-[660px]">
                <h2 className="font-serif text-3xl text-gray-950">
                  Últimos anuncios publicados
                </h2>
                {ultimosAnuncios.length > 0
                  ? renderProductGrid(ultimosAnuncios)
                  : renderEmptyResults()}
              </section>

              <section className="min-h-[500px] sm:min-h-[620px] lg:min-h-[660px]">
                <h2 className="font-serif text-3xl text-gray-950">
                  Puede interesarte
                </h2>
                {puedeInteresarteFinal.length > 0
                  ? renderProductGrid(puedeInteresarteFinal)
                  : renderEmptyResults()}
            </section>
            </div>
          </div>
        )}
        </section>
      </main>
    </>
  );
}



'use client';



import {

  useCallback,

  useEffect,

  useMemo,

  useState

} from 'react';

import AdminBottomNav from '@/components/admin/AdminBottomNav';

import Link from 'next/link';



import AddProductForm, {

  DescriptionEditor

} from '@/components/admin/AddProductForm';



import {

  LayoutDashboard,

  Package,

  PackagePlus,

  Pencil,

  ClipboardList,

  Boxes,

  Search,

  RefreshCw,

  ChevronRight,

  Menu,

  X,

  ArrowUpRight,

  AlertTriangle,

  Check,

  Loader2,

  Truck,

  ZoomIn

} from 'lucide-react';



// ----------------------------------------

// HELPERS

// ----------------------------------------



const money = n =>

  `৳${Number(n || 0).toLocaleString('en-BD')}`;



const hasCourierInfo = o => Boolean(String(o.courier?.consignmentId || '').trim() || String(o.courier?.trackLink || '').trim());

const codForOrder = o => o.paymentMethod === 'Cash on Delivery' ? Number(o.total || 0) : 0;



async function request(action, data = {}) {

  const r = await fetch('/api/product-entry', {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json'

    },

    body: JSON.stringify({

      action,

      ...data

    }),

    cache: 'no-store'

  });



  const j = await r.json();



  if (!r.ok || !j.success) {

    throw Error(j.error || 'Request failed');

  }



  return j.data;

}



const blank = {

  productName: '',

  gender: 'Male',

  category: '',

  subcategory: '',

  price: '',

  oldPrice: '',

  purchasePrice: '',

  purchasedQty: '',

  status: 'Active',

  description: ''

};



const sections = [

  {

    key: 'overview',

    label: 'Overview',

    icon: LayoutDashboard

  },

  {

    key: 'add',

    label: 'Add Product',

    icon: PackagePlus

  },

  {

    key: 'edit',

    label: 'Edit Product',

    icon: Pencil

  },

  {

    key: 'orders',

    label: 'Orders',

    icon: ClipboardList

  },

  {

    key: 'inventory',

    label: 'Product Inventory',

    icon: Boxes

  }

];



// ----------------------------------------

// Convert selected product images to the same WebP format as Add Product.
async function editImageToWebp(file) {
  if (!file?.type?.startsWith('image/') || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 12 MB.');
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable.')); return; }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob || blob.type !== 'image/webp') {
          reject(new Error('WebP conversion failed.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve({
          mimeType: 'image/webp',
          base64: String(reader.result).split(',')[1]
        });
        reader.onerror = () => reject(new Error('Image reading failed.'));
        reader.readAsDataURL(blob);
      }, 'image/webp', 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not open selected image.'));
    };
    image.src = objectUrl;
  });
}

// EDIT PRODUCT DESCRIPTION

// ----------------------------------------



function EditDescription({

  initialHtml,

  onChange

}) {

  // Capture loaded HTML once so typing

  // does not reset the editor or caret.



  const [loadedHtml] = useState(initialHtml);



  return (

    <DescriptionEditor

      initialHtml={loadedHtml}

      onChange={onChange}

    />

  );

}



// ----------------------------------------

// ADMIN DASHBOARD

// ----------------------------------------



export default function AdminPage() {

  const [tab, setTab] = useState('overview');

  const [mobile, setMobile] = useState(false);



  const [data, setData] = useState({

    products: [],

    orders: [],

    categories: []

  });



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [query, setQuery] = useState('');

  const [searchField, setSearchField] = useState('all');

  const [edit, setEdit] = useState(null);
  const [editImageFiles, setEditImageFiles] = useState([null, null, null]);
  const [editImagePreviews, setEditImagePreviews] = useState(['', '', '']);

  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState('');

  const [orderQuery, setOrderQuery] = useState('');

  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [lightbox, setLightbox] = useState(null);

  const [confirmOrderId, setConfirmOrderId] = useState(null);

  const [sendingOrderId, setSendingOrderId] = useState(null);

  const [courierError, setCourierError] = useState('');



  // --------------------------------------

  // LOAD DASHBOARD DATA

  // --------------------------------------



  const refresh = useCallback(async () => {

    setLoading(true);

    setError('');



    try {

      const d = await request('adminDashboard');

      setData(d);

    } catch (e) {

      setError(e.message);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    refresh();

  }, [refresh]);



  const products = data.products || [];

  const orders = data.orders || [];

  const categories = data.categories || [];



  const confirmOrder = orders.find(o => String(o.orderId) === String(confirmOrderId));



  async function sendToSteadfast() {

    if (!confirmOrder || sendingOrderId) return;

    const orderId = String(confirmOrder.orderId);

    if (hasCourierInfo(confirmOrder) || confirmOrder.status === 'Cancelled') return;

    setSendingOrderId(orderId);

    setCourierError('');

    try {

      await request('courierSend', { orderId });

      await refresh();

      setConfirmOrderId(null);

      setExpandedOrderId(orderId);

    } catch (e) {

      setCourierError(e.message || 'Could not create Steadfast parcel.');

    } finally {

      setSendingOrderId(null);

    }

  }



  const filteredOrders = orders.filter(o => {

    const text = [o.orderId, o.customer?.name, o.customer?.phone, o.status, o.paymentMethod, ...(o.items || []).map(i => i.productName)].join(' ').toLowerCase();

    return text.includes(orderQuery.trim().toLowerCase());

  });



  // --------------------------------------

  // PRODUCT FILTER

  // --------------------------------------



  const filtered = useMemo(() => {

    const term = query.trim().toLowerCase();

    if (!term) return products;



    return products.filter(p => {

      const values = {

        product: p.productName ?? '',

        id: p.id ?? '',

        category: p.category ?? '',

        price: String(p.price ?? ''),

        status: p.status ?? ''

      };



      const fields = searchField === 'all'

        ? Object.values(values)

        : [values[searchField]];



      return fields.some(value =>

        String(value ?? '').toLowerCase().includes(term)

      );

    });

  }, [products, query, searchField]);



  const low = products.filter(

    p => Number(p.stock) <= 5

  );



  const active = products.filter(

    p => p.status === 'Active'

  );



  // --------------------------------------

  // NAVIGATION

  // --------------------------------------



  function navigate(k) {

    setTab(k);

    setMobile(false);

    setNotice('');



    if (k !== 'edit') {

      setEdit(null);

    }

  }



  // --------------------------------------

  // EDIT PRODUCT

  // --------------------------------------



  function beginEdit(p) {

    // Reset pending uploads when switching between products.
    setEditImageFiles([null, null, null]);
    setEditImagePreviews(['', '', '']);

    setEdit({

      ...blank,

      ...p,

      price: String(p.price ?? ''),

      oldPrice: String(p.oldPrice ?? ''),

      purchasePrice: String(p.purchasePrice ?? ''),

      purchasedQty: String(p.purchasedQty ?? '')

    });



    navigate('edit');

  }



  // --------------------------------------

  useEffect(() => {
    return () => editImagePreviews.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }, [editImagePreviews]);

  function chooseEditImage(slot, file) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) {
      setNotice('Choose an image smaller than 12 MB.');
      return;
    }
    setEditImageFiles(prev => prev.map((v, i) => i === slot ? file : v));
    setEditImagePreviews(prev => prev.map((v, i) => i === slot ? URL.createObjectURL(file) : v));
    setNotice('Image selected. Click Save changes to upload.');
  }

  // SAVE EDITED PRODUCT

  // --------------------------------------



  async function save(e) {
    e.preventDefault();
    if (saving || !edit) return;
    setSaving(true);
    setNotice('Saving product details...');
    try {
      // Save text fields first. Existing image URLs are preserved.
      await request('productSave', {
        product: { ...edit, id: edit.id }
      });

      const nextImages = [...(edit.images || [])];
      for (let i = 0; i < 3; i++) {
        const file = editImageFiles[i];
        if (!file) continue;
        setNotice(`Uploading image ${i + 1} of product ${edit.id}...`);
        const converted = await editImageToWebp(file);
        // The Apps Script productImage action must replace the requested slot.
        const result = await request('productImage', {
          productId: edit.id,
          slot: i + 1,
          fileName: file.name,
          replace: true,
          ...converted
        });
        if (!result?.url) {
          throw new Error(`Image ${i + 1} was not replaced. Check Apps Script productImage.`);
        }
        nextImages[i] = result.url;
        // Clear only successful uploads, allowing failed ones to be retried.
        setEditImageFiles(prev => prev.map((v, n) => n === i ? null : v));
        setEditImagePreviews(prev => prev.map((v, n) => n === i ? '' : v));
        setEdit(prev => prev?.id === edit.id ? { ...prev, images: [...nextImages] } : prev);
      }
      await refresh();
      setNotice(`Product ${edit.id} updated successfully.`);
    } catch (err) {
      setNotice(`Error: ${err.message}. Product details or earlier images may already be saved; retry remaining images.`);
    } finally {
      setSaving(false);
    }
  }

  // SHARED STYLES

  // --------------------------------------



  const card =

    'rounded-2xl border border-[#e7e7e7] bg-white shadow-[0_2px_16px_rgba(0,0,0,.025)]';



  const input =

    'w-full rounded-xl border border-[#e4e4e4] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#171717]';



  const currentSection = sections.find(

    s => s.key === tab

  );



  // --------------------------------------

  // PAGE

  // --------------------------------------



  return (

    <div

      className="min-h-screen min-w-0 overflow-x-clip bg-[#f7f7f6] text-[#202020]"

      style={{

        fontFamily: 'Figtree,Arial,sans-serif'

      }}

    >

      <div className="grid min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">



        {/* --------------------------------

            SIDEBAR

        -------------------------------- */}



        <aside

          className={`

            ${mobile ? 'block' : 'hidden'}

            relative min-w-0 border-b

            border-[#e8e8e8] bg-white

            lg:block lg:border-b-0 lg:border-r

          `}

        >

          {/* Sidebar Brand */}



          <div className="flex h-20 items-center justify-between border-b border-[#f0f0f0] px-7">

            <div>

              <div className="text-[21px] font-black tracking-[.18em]">

                MAHAKRON

              </div>



              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.25em] text-[#999]">

                Store management

              </div>

            </div>



            <button

              className="lg:hidden"

              onClick={() => setMobile(false)}

              aria-label="Close menu"

            >

              <X size={20} />

            </button>

          </div>



          {/* Sidebar Navigation */}



          <div className="px-4 pt-7">

            <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[#999]">

              Workspace

            </div>



            <nav className="space-y-1">

              {sections.map(s => {

                const Icon = s.icon;



                return (

                  <button

                    key={s.key}

                    onClick={() => navigate(s.key)}

                    className={`

                      flex w-full items-center gap-3

                      rounded-xl px-3.5 py-3

                      text-left text-[13px]

                      font-semibold transition

                      ${

                        tab === s.key

                          ? 'bg-[#1b1b1b] text-white'

                          : 'text-[#666] hover:bg-[#f6f6f6] hover:text-[#171717]'

                      }

                    `}

                  >

                    <Icon

                      size={18}

                      strokeWidth={1.8}

                    />



                    <span className="flex-1">

                      {s.label}

                    </span>



                    {tab === s.key && (

                      <ChevronRight size={14} />

                    )}

                  </button>

                );

              })}

            </nav>

          </div>



          {/* Sidebar Information */}



          <div className="m-4 rounded-xl bg-[#f6f6f6] p-4 lg:mt-8">

            <div className="text-xs font-bold">

              MAHAKRON Admin

            </div>



            <p className="mt-1 text-[11px] leading-relaxed text-[#777]">

              Connected to your existing Google

              Sheets &amp; Cloudinary workflow.

            </p>

          </div>

        </aside>



        {/* --------------------------------

            MAIN CONTENT AREA

        -------------------------------- */}



        <div className="min-w-0">



          {/* HEADER */}



          <header className="flex h-16 min-w-0 items-center justify-between gap-2 border-b border-[#eaeaea] bg-white px-3 sm:px-5 md:h-20 md:px-9">



            <div className="flex items-center gap-3">



              {/* Mobile Menu */}



              <button

                className="lg:hidden"

                onClick={() => setMobile(!mobile)}

                aria-label={

                  mobile

                    ? 'Close menu'

                    : 'Open menu'

                }

              >

                {mobile ? (

                  <X size={22} />

                ) : (

                  <Menu size={22} />

                )}

              </button>



              {/* --------------------------------

                  HIDE ADD PRODUCT HEADING ONLY

              -------------------------------- */}



              {/* {tab !== 'add' && (

                <div>

                  <div className="text-[11px] font-medium text-[#999]">

                    Workspace /{' '}



                    <span className="text-[#555]">

                      {currentSection?.label}

                    </span>

                  </div>



                  <h1 className="mt-0.5 text-lg font-bold tracking-tight md:text-xl">

                    {currentSection?.label}

                  </h1>

                </div>

              )} */}

            </div>



            {/* Header Actions */}



            <div className="flex items-center gap-2">



              <button

                onClick={refresh}

                disabled={loading}

                className="flex items-center gap-2 rounded-xl border border-[#e8e8e8] px-3 py-2 text-xs font-semibold hover:bg-[#fafafa]"

              >

                <RefreshCw

                  size={15}

                  className={

                    loading

                      ? 'animate-spin'

                      : ''

                  }

                />



                <span className="hidden sm:inline">

                  Refresh

                </span>

              </button>



              <Link

                href="/"

                target="_blank"

                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1b1b1b] px-2.5 py-2.5 text-[11px] font-semibold text-white sm:px-3.5 sm:text-xs"

              >

                View store



                <ArrowUpRight size={14} />

              </Link>

            </div>

          </header>



          {/* --------------------------------

              MAIN DASHBOARD CONTENT

          -------------------------------- */}



          <main className="mx-auto w-full max-w-[1450px] min-w-0 space-y-7 px-3 py-5 pb-24 sm:px-5 md:p-9 lg:pb-9">



            {/* ERROR MESSAGE */}



            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                Could not load admin data: {error}.

                Make sure the new Apps Script action

                is deployed.

              </div>

            )}



            {/* ------------------------------

                OVERVIEW TAB

            ------------------------------ */}



            {tab === 'overview' && (
              <div className="min-w-0 space-y-5 sm:space-y-7">
                {/* Overview Header */}
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#999] sm:text-xs sm:tracking-[.2em]">Store snapshot</p>
                    <h2 className="mt-2 break-words text-xl font-bold tracking-tight sm:text-2xl">Your store at a glance</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#888] sm:text-sm">Live information from your existing Google Sheet.</p>
                  </div>
                  <button type="button" onClick={() => navigate('add')} className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] px-4 py-3 text-sm font-semibold text-white sm:w-auto">
                    <PackagePlus size={17} /> Add product
                  </button>
                </div>

                {/* Statistics */}
                <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
                  {[
                    ['Total Products', products.length, Package],
                    ['Active Products', active.length, Check],
                    ['Total Orders', orders.length, ClipboardList],
                    ['Low Stock (≤5)', low.length, AlertTriangle],
                  ].map(([label, val, Icon]) => (
                    <div key={label} className={`${card} min-w-0 p-3 sm:p-5`}>
                      <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
                        <span className="min-w-0 break-words text-[10px] font-semibold leading-snug text-[#888] sm:text-xs">{label}</span>
                        <span className="shrink-0 rounded-lg bg-[#f5f5f5] p-1.5 sm:rounded-xl sm:p-2.5"><Icon size={16} className="sm:h-[18px] sm:w-[18px]" /></span>
                      </div>
                      <div className="mt-4 break-all text-2xl font-bold tabular-nums sm:text-3xl">{loading ? '—' : val}</div>
                      <div className="mt-1 text-[10px] leading-snug text-[#aaa] sm:text-[11px]">Current sheet data</div>
                    </div>
                  ))}
                </div>

                {/* Overview Lists */}
                <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
                  <section className={`${card} min-w-0 p-3.5 sm:p-5`}>
                    <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
                      <h3 className="min-w-0 text-sm font-bold sm:text-base">Low stock products</h3>
                      <button type="button" className="shrink-0 text-xs font-semibold underline" onClick={() => navigate('inventory')}>Inventory</button>
                    </div>
                    {low.slice(0, 6).map(p => (
                      <div key={p.id} className="flex min-w-0 items-center justify-between gap-3 border-t border-[#f0f0f0] py-3 text-xs sm:text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium" title={p.productName}>{p.productName}</p>
                          <p className="mt-1 truncate text-[10px] text-[#999] sm:text-xs">ID: {p.id}</p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs font-semibold sm:text-sm">{p.stock} left</span>
                      </div>
                    ))}
                    {!low.length && <p className="py-8 text-center text-sm text-[#aaa]">No low-stock products</p>}
                  </section>

                  <section className={`${card} min-w-0 p-3.5 sm:p-5`}>
                    <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
                      <h3 className="min-w-0 text-sm font-bold sm:text-base">Recent orders</h3>
                      <button type="button" className="shrink-0 text-xs font-semibold underline" onClick={() => navigate('orders')}>All orders</button>
                    </div>
                    {orders.slice(0, 6).map(o => (
                      <div key={o.orderId} className="flex min-w-0 items-center justify-between gap-3 border-t border-[#f0f0f0] py-3 text-xs sm:text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold" title={String(o.orderId)}>{o.orderId}</div>
                          <div className="mt-1 truncate text-[10px] text-[#999] sm:text-xs">{o.customer?.name || 'Customer'}</div>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <div className="whitespace-nowrap text-xs font-semibold sm:text-sm">{money(o.total)}</div>
                          <div className="mt-1 max-w-[110px] truncate text-[10px] text-[#999] sm:text-xs">{o.status}</div>
                        </div>
                      </div>
                    ))}
                    {!orders.length && <p className="py-8 text-center text-sm text-[#aaa]">No orders yet</p>}
                  </section>
                </div>
              </div>
            )}

            {/* ------------------------------

                ADD PRODUCT TAB



                Keep component mounted to

                preserve pending uploads.

            ------------------------------ */}



            <div

              className={

                tab === 'add' ? '' : 'hidden'

              }

            >

              <AddProductForm />

            </div>



            {/* ------------------------------

                INVENTORY / EDIT PRODUCT

            ------------------------------ */}



            {(tab === 'inventory' ||

              tab === 'edit') && (

              <>

                <div className="flex flex-wrap items-center justify-between gap-3">



                  <div>

                    <h2 className="text-xl font-bold">

                      {tab === 'edit' && edit

                        ? `Editing ${edit.id}`

                        : 'Product inventory'}

                    </h2>



                    <p className="mt-1 text-xs text-[#888]">

                      {products.length} products ·

                      Edits save to your existing

                      Products sheet

                    </p>

                  </div>



                  {tab === 'edit' && edit && (

                    <button

                      className="rounded-lg border px-3 py-2 text-xs font-semibold"

                      onClick={() => {

                        setEdit(null);

                        navigate('inventory');

                      }}

                    >

                      Back to inventory

                    </button>

                  )}

                </div>



                {/* --------------------------

                    EDIT PRODUCT FORM

                -------------------------- */}



                {tab === 'edit' && edit ? (

                  <form

                    onSubmit={save}

                    className={`${card} max-w-4xl space-y-6 p-6 md:p-8`}

                  >



                    {/* Product Identity */}



                    <div className="flex items-center gap-4">

                      {edit.images?.[0] && (

                        <img

                          src={edit.images[0]}

                          alt="Product"

                          className="h-16 w-16 rounded-xl border object-contain"

                        />

                      )}



                      <div>

                        <div className="font-bold">

                          {edit.productName}

                        </div>



                        <div className="text-xs text-[#999]">

                          Product ID {edit.id} ·

                          ID stays unchanged

                        </div>

                      </div>

                    </div>



                    {/* Edit Fields */}



                    <div className="grid gap-4 sm:grid-cols-2">



                      {[

                        [

                          'Product name',

                          'productName',

                          'text'

                        ],

                        [

                          'Subcategory',

                          'subcategory',

                          'text'

                        ],

                        [

                          'Selling price',

                          'price',

                          'number'

                        ],

                        [

                          'Old price',

                          'oldPrice',

                          'number'

                        ],

                        [

                          'Purchase price',

                          'purchasePrice',

                          'number'

                        ],

                        [

                          'Purchased quantity',

                          'purchasedQty',

                          'number'

                        ]

                      ].map(([label, key, type]) => (

                        <label

                          key={key}

                          className="text-xs font-semibold text-[#666]"

                        >

                          {label}



                          <input

                            required={[

                              'productName',

                              'price',

                              'purchasePrice',

                              'purchasedQty'

                            ].includes(key)}

                            type={type}

                            min={

                              type === 'number'

                                ? 0

                                : undefined

                            }

                            step={

                              type === 'number'

                                ? 'any'

                                : undefined

                            }

                            value={edit[key] ?? ''}

                            onChange={e =>

                              setEdit(f => ({

                                ...f,

                                [key]: e.target.value

                              }))

                            }

                            className={`mt-2 ${input}`}

                          />

                        </label>

                      ))}



                      {/* Gender */}



                      <label className="text-xs font-semibold text-[#666]">

                        Gender



                        <select

                          className={`mt-2 ${input}`}

                          value={edit.gender}

                          onChange={e =>

                            setEdit(f => ({

                              ...f,

                              gender: e.target.value,

                              category: ''

                            }))

                          }

                        >

                          {[

                            'Male',

                            'Female'

                          ].map(v => (

                            <option key={v}>

                              {v}

                            </option>

                          ))}

                        </select>

                      </label>



                      {/* Category */}



                      <label className="text-xs font-semibold text-[#666]">

                        Category



                        <select

                          required

                          className={`mt-2 ${input}`}

                          value={edit.category}

                          onChange={e =>

                            setEdit(f => ({

                              ...f,

                              category: e.target.value

                            }))

                          }

                        >

                          <option value="">

                            Choose category

                          </option>



                          {[

                            ...new Set(

                              [

                                ...categories

                                  .filter(

                                    c =>

                                      c.gender ===

                                      edit.gender

                                  )

                                  .map(

                                    c => c.category

                                  ),

                                edit.category

                              ].filter(Boolean)

                            )

                          ].map(v => (

                            <option key={v}>

                              {v}

                            </option>

                          ))}

                        </select>

                      </label>



                      {/* Status */}



                      <label className="text-xs font-semibold text-[#666]">

                        Status



                        <select

                          className={`mt-2 ${input}`}

                          value={edit.status}

                          onChange={e =>

                            setEdit(f => ({

                              ...f,

                              status: e.target.value

                            }))

                          }

                        >

                          {[

                            'Active',

                            'Inactive',

                            'Out of Stock'

                          ].map(v => (

                            <option key={v}>

                              {v}

                            </option>

                          ))}

                        </select>

                      </label>

                    </div>



                    {/* Rich Text Description */}



                    <EditDescription

                      key={edit.id}

                      initialHtml={

                        edit.description || ''

                      }

                      onChange={value =>

                        setEdit(f => ({

                          ...f,

                          description: value

                        }))

                      }

                    />



                                        {/* Edit product images: each slot can be replaced independently */}
                    <section className="space-y-3 rounded-2xl border border-[#e7e7e7] p-3 sm:p-5">
                      <div>
                        <h3 className="text-sm font-bold sm:text-base">Product images</h3>
                        <p className="mt-1 text-xs text-[#888]">
                          Select a new image to replace a slot. Unselected images stay unchanged.
                          Maximum 12 MB each; converted to WebP before upload.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[0, 1, 2].map(i => {
                          const src = editImagePreviews[i] || edit.images?.[i];
                          return (
                            <div key={i} className="min-w-0 rounded-xl border border-[#e7e7e7] p-2 sm:p-3">
                              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[#fafafa]">
                                {src ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightbox({ src, alt: `Product image ${i + 1}` })}
                                    aria-label={`View product image ${i + 1} larger`}
                                    title="Click to enlarge"
                                    className="group relative h-full w-full cursor-zoom-in"
                                  >
                                    <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-contain" />
                                    <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">View</span>
                                  </button>
                                ) : (
                                  <Package size={25} className="text-[#bbb]" />
                                )}
                              </div>
                              <p className="mt-2 text-center text-xs font-semibold">Image {i + 1}</p>
                              <label className="mt-2 block cursor-pointer rounded-lg border border-[#ddd] px-2 py-2 text-center text-[11px] font-semibold hover:bg-[#fafafa] sm:text-xs">
                                {editImageFiles[i] ? 'Change selection' : src ? 'Replace image' : 'Add image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  disabled={saving}
                                  onChange={e => {
                                    chooseEditImage(i, e.target.files?.[0]);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              {editImageFiles[i] && (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => {
                                    setEditImageFiles(prev => prev.map((v, n) => n === i ? null : v));
                                    setEditImagePreviews(prev => prev.map((v, n) => n === i ? '' : v));
                                  }}
                                  className="mt-2 w-full text-center text-[11px] text-red-600 underline"
                                >
                                  Cancel selection
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>



                    {/* Save Status */}



                    {notice && (

                      <div

                        role="status"

                        className="rounded-xl bg-[#f5f5f5] p-3 text-sm"

                      >

                        {notice}

                      </div>

                    )}



                    {/* Save Button */}



                    <button

                      disabled={saving}

                      className="flex items-center gap-2 rounded-xl bg-[#1b1b1b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"

                    >

                      {saving ? (

                        <Loader2

                          size={16}

                          className="animate-spin"

                        />

                      ) : (

                        <Check size={16} />

                      )}



                      Save changes

                    </button>

                  </form>

                ) : (



                  /* ------------------------

                      PRODUCT INVENTORY

                  ------------------------ */



                  <section

                    className={`${card} overflow-hidden`}

                  >



                    {/* Responsive inventory search */}

                    <div className="space-y-3 border-b border-[#f0f0f0] p-3 sm:p-5">

                      <div className="flex items-center justify-between gap-2">

                        <h3 className="text-sm font-bold sm:text-base">All products</h3>

                        <span className="text-xs text-[#888]">

                          {filtered.length} results

                        </span>

                      </div>



                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

                        <label className="sr-only" htmlFor="inventory-search-field">

                          Search by

                        </label>

                        <select

                          id="inventory-search-field"

                          value={searchField}

                          onChange={e => setSearchField(e.target.value)}

                          className="w-full min-w-0 rounded-xl border border-[#e4e4e4] bg-white px-3 py-3 text-sm text-[#222] outline-none focus:border-[#171717] sm:w-40"

                        >

                          <option value="all">All fields</option>

                          <option value="product">Product</option>

                          <option value="id">ID</option>

                          <option value="category">Category</option>

                          <option value="price">Price</option>

                          <option value="status">Status</option>

                        </select>



                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e4e4e4] bg-white px-3 focus-within:border-[#171717] focus-within:ring-2 focus-within:ring-black/5">

                          <Search size={17} className="shrink-0 text-[#999]" />

                          <input

                            type="search"

                            aria-label="Search inventory"

                            placeholder="Search products..."

                            value={query}

                            onChange={e => setQuery(e.target.value)}

                            className="min-w-0 w-full flex-1 bg-transparent py-3 text-sm text-[#222] outline-none placeholder:text-[#999]"

                          />

                        </div>

                      </div>

                    </div>



                    {/* Mobile product cards: tap product to edit */}

                    <div className="divide-y divide-[#f0f0f0] md:hidden">

                      {filtered.map(p => (

                        <button

                          key={p.id}

                          type="button"

                          onClick={() => beginEdit(p)}

                          className="flex w-full min-w-0 items-start gap-3 p-3 text-left transition hover:bg-[#fafafa] active:bg-[#f3f3f3] sm:p-4"

                          aria-label={`Edit ${p.productName}`}

                        >

                          {p.images?.[0] ? (

                            <img

                              src={p.images[0]}

                              alt=""

                              className="h-16 w-16 shrink-0 rounded-xl border border-[#eee] object-contain"

                            />

                          ) : (

                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4]">

                              <Package size={20} className="text-[#aaa]" />

                            </div>

                          )}

                          <div className="min-w-0 flex-1 space-y-1.5">

                            <div className="line-clamp-2 break-words text-sm font-semibold text-[#202020]">

                              {p.productName}

                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#777]">

                              <span>ID: {p.id}</span>

                              <span>·</span>

                              <span>{p.category}</span>

                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">

                              <span className="font-bold text-[#171717]">{money(p.price)}</span>

                              <span className="rounded-md bg-[#f4f4f4] px-2 py-0.5 text-[#666]">

                                {p.status}

                              </span>

                              <span className={Number(p.stock) <= 5 ? 'text-amber-700' : 'text-[#888]'}>

                                Stock: {p.stock}

                              </span>

                            </div>

                          </div>

                          <Pencil size={16} className="mt-1 shrink-0 text-[#888]" />

                        </button>

                      ))}

                      {!filtered.length && (

                        <p className="p-8 text-center text-sm text-[#999]">No matching products</p>

                      )}

                    </div>



                    {/* Inventory Table */}



                    <div className="hidden overflow-x-auto md:block">

                      <table className="w-full min-w-[740px] text-left text-sm">



                        <thead className="bg-[#fafafa] text-xs text-[#999]">

                          <tr>

                            {[

                              'Product',

                              'ID',

                              'Category',

                              'Price',

                              'Stock',

                              'Status',

                              'Action'

                            ].map(h => (

                              <th

                                key={h}

                                className="px-5 py-3 font-semibold"

                              >

                                {h}

                              </th>

                            ))}

                          </tr>

                        </thead>



                        <tbody>

                          {filtered.map(p => (

                            <tr

                              key={p.id}

                              className="border-t border-[#f1f1f1]"

                            >



                              {/* Product */}



                              <td className="px-5 py-3">

                                <div className="flex items-center gap-3">

                                  {p.images?.[0] ? (

                                    <button
                                      type="button"
                                      onClick={() => setLightbox({ src: p.images[0], alt: p.productName || 'Product image' })}
                                      aria-label={`View larger image of ${p.productName || 'product'}`}
                                      className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                    >
                                      <img
                                        src={p.images[0]}
                                        alt=""
                                        className="h-full w-full object-contain"
                                      />
                                    </button>

                                  ) : (

                                    <div className="h-11 w-11 rounded-lg bg-[#f3f3f3]" />

                                  )}



                                  <button

                                    type="button"

                                    onClick={() => beginEdit(p)}

                                    className="max-w-[240px] truncate text-left font-semibold hover:underline focus-visible:underline"

                                    title="Edit product"

                                  >

                                    {p.productName}

                                  </button>

                                </div>

                              </td>



                              {/* ID */}



                              <td className="px-5 py-3 text-[#777]">

                                {p.id}

                              </td>



                              {/* Category */}



                              <td className="px-5 py-3">

                                {p.category}

                              </td>



                              {/* Price */}



                              <td className="px-5 py-3">

                                {money(p.price)}

                              </td>



                              {/* Stock */}



                              <td className="px-5 py-3">

                                <span

                                  className={

                                    Number(p.stock) <= 5

                                      ? 'font-bold text-amber-700'

                                      : ''

                                  }

                                >

                                  {p.stock}

                                </span>

                              </td>



                              {/* Status */}



                              <td className="px-5 py-3 text-xs">

                                {p.status}

                              </td>



                              {/* Edit Action */}



                              <td className="px-5 py-3">

                                <button

                                  onClick={() =>

                                    beginEdit(p)

                                  }

                                  className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-[#f6f6f6]"

                                >

                                  <Pencil size={13} />

                                  Edit

                                </button>

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>



                      {!filtered.length && (

                        <p className="p-10 text-center text-sm text-[#999]">

                          No matching products

                        </p>

                      )}

                    </div>

                  </section>

                )}

              </>

            )}



            {/* ------------------------------

                ORDERS TAB

            ------------------------------ */}



            {tab === 'orders' && (

              <section className={`${card} overflow-hidden`}>

                <div className="space-y-4 border-b border-[#f0f0f0] p-4 sm:p-5">

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>

                      <h2 className="text-xl font-bold">Orders</h2>

                      <p className="mt-1 text-xs text-[#888]">

                        Orders from your existing Google Sheet · Read-only

                      </p>

                    </div>

                    <span className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-xs font-semibold">

                      {filteredOrders.length} orders

                    </span>

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-[#e4e4e4] px-3 focus-within:border-[#171717]">

                    <Search size={17} className="shrink-0 text-[#999]" />

                    <input

                      type="search"

                      value={orderQuery}

                      onChange={e => setOrderQuery(e.target.value)}

                      placeholder="Search order ID, customer, phone, product, status..."

                      aria-label="Search orders"

                      className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"

                    />

                  </div>

                </div>



                {loading ? (

                  <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#888]">

                    <Loader2 size={18} className="animate-spin" /> Loading orders...

                  </div>

                ) : !filteredOrders.length ? (

                  <p className="p-10 text-center text-sm text-[#999]">

                    {orderQuery ? 'No matching orders' : 'No orders yet'}

                  </p>

                ) : (

                  <div className="divide-y divide-[#eee]">

                    {filteredOrders.map(o => {

                      const expanded = expandedOrderId === String(o.orderId);

                      const itemCount = (o.items || []).reduce((n, i) => n + Number(i.quantity || 0), 0);

                      return (

                        <div key={String(o.orderId)} className={hasCourierInfo(o) ? "bg-pink/10 ring-1 ring-inset ring-pink/30" : ""}>

                          <button

                            type="button"

                            onClick={() => setExpandedOrderId(expanded ? null : String(o.orderId))}

                            aria-expanded={expanded}

                            className="flex w-full min-w-0 flex-col gap-3 p-4 text-left transition hover:bg-black/[.025] sm:flex-row sm:items-center sm:justify-between sm:p-5"

                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4]">

                                <ClipboardList size={19} />

                              </div>

                              <div className="min-w-0">

                                <div className="break-all text-sm font-bold">{o.orderId}</div>

                                <div className="mt-1 text-xs text-[#888]">

                                  {o.customer?.name || 'Customer'} · {o.customer?.phone || 'No phone'}

                                </div>

                                <div className="mt-1 text-[11px] text-[#aaa]">

                                  {String(o.date || '').slice(0, 16).replace('T', ' ')} · {itemCount} item{itemCount === 1 ? '' : 's'}

                                </div>

                              </div>

                            </div>

                            <div className="flex w-full items-center justify-between gap-3 pl-[52px] sm:w-auto sm:justify-end sm:pl-0">

                              <div className="text-right">

                                <div className="text-sm font-bold">{money(o.total)}</div>

                                <div className="mt-1 text-xs text-[#777]">{o.status || '—'}</div>

                                {hasCourierInfo(o) && <div className="mt-1 text-[11px] font-bold text-pink">Steadfast: {o.courier?.status || 'Created'}</div>}

                              </div>

                              <ChevronRight size={18} className={`shrink-0 text-[#888] transition-transform ${expanded ? 'rotate-90' : ''}`} />

                            </div>

                          </button>



                          {expanded && (

                            <div className="space-y-5 border-t border-[#f0f0f0] p-4 sm:p-6">

                              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">

                                <div>

                                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#888]">Customer</h3>

                                  <p className="font-semibold">{o.customer?.name || '—'}</p>

                                  <p className="mt-1 break-words">{o.customer?.phone || '—'}</p>

                                  <p className="mt-1 break-words">{o.customer?.email || '—'}</p>

                                  <p className="mt-1 break-words text-[#666]">{o.customer?.address || '—'}</p>

                                  <p className="mt-1 text-[#666]">{o.customer?.cityArea || ''}</p>

                                </div>

                                <div>

                                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#888]">Payment & delivery</h3>

                                  <p>Payment: <strong>{o.paymentMethod || '—'}</strong></p>

                                  <p className="mt-1">Status: <strong>{o.status || '—'}</strong></p>

                                  <p className="mt-1">Subtotal: {money(o.subtotal)}</p>

                                  <p className="mt-1">Delivery: {money(o.deliveryCharge)}</p>

                                  <p className="mt-1 font-bold">Total: {money(o.total)}</p>

                                  {o.note && <p className="mt-2 break-words text-[#666]">Note: {o.note}</p>}

                                </div>

                                <div>

                                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#888]">Courier</h3>

                                  <p>Action: {o.courier?.action || '—'}</p>

                                  <p className="mt-1">Status: {o.courier?.status || '—'}</p>

                                  <p className="mt-1 break-all">Consignment: {o.courier?.consignmentId || '—'}</p>

                                  <p className="mt-1">SteadFast Charge: <strong>{o.courier?.steadfastCharge == null ? 'Not available from API' : money(o.courier.steadfastCharge)}</strong></p>

                                  {/^https?:\/\//i.test(String(o.courier?.trackLink || '')) && (

                                    <a href={o.courier.trackLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline">

                                      Track shipment

                                    </a>

                                  )}

                                </div>

                              </div>



                              <div className="flex flex-wrap items-center gap-3">

                                {hasCourierInfo(o) ? (

                                  <span className="rounded-xl border border-pink/40 bg-pink/10 px-4 py-2.5 text-xs font-bold text-pink">

                                    <Truck size={15} className="mr-2 inline" /> Sent to Steadfast · {o.courier?.consignmentId}

                                  </span>

                                ) : (

                                  <button

                                    type="button"

                                    disabled={o.status === 'Cancelled' || !!sendingOrderId}

                                    onClick={() => { setCourierError(''); setConfirmOrderId(String(o.orderId)); }}

                                    className="inline-flex items-center gap-2 rounded-xl bg-[#1b1b1b] px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"

                                  >

                                    <Truck size={16} /> Send to Steadfast

                                  </button>

                                )}

                              </div>



                              <div>

                                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">Ordered products</h3>

                                <div className="overflow-hidden rounded-xl border border-[#eaeaea] bg-white">

                                  {(o.items || []).map((item, index) => (

                                    <div key={`${item.productId}-${index}`} className="flex items-center gap-3 border-b border-[#f0f0f0] p-3 last:border-b-0">

                                      {item.image ? (

                                        <button type="button" onClick={() => setLightbox({ src: item.image, alt: item.productName || 'Order product' })} aria-label={`View larger image of ${item.productName || 'product'}`} className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-white">

                                          <img src={item.image} alt={item.productName || 'Order product'} className="h-full w-full object-contain" />

                                          <ZoomIn size={13} className="absolute bottom-0 right-0 rounded-tl bg-white/90" />

                                        </button>

                                      ) : (

                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5]"><Package size={18} /></div>

                                      )}

                                      <div className="min-w-0 flex-1">

                                        <p className="break-words text-sm font-semibold">{item.productName || item.productId}</p>

                                        <p className="mt-1 text-xs text-[#888]">ID: {item.productId} · Qty: {item.quantity} × {money(item.price)}</p>

                                      </div>

                                      <span className="shrink-0 text-sm font-bold">{money(item.subtotal)}</span>

                                    </div>

                                  ))}

                                </div>

                              </div>

                            </div>

                          )}

                        </div>

                      );

                    })}

                  </div>

                )}

              </section>

            )}



          </main>

        </div>

      </div>

      {/* Shared image lightbox: order items and edit-product previews */}

      {lightbox && (

        <div role="dialog" aria-modal="true" aria-label="Product image preview" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>

          <button type="button" aria-label="Close image" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white p-2 text-black"><X size={22} /></button>

          <img src={lightbox.src} alt={lightbox.alt} className="max-h-[85vh] max-w-full object-contain" onClick={e => e.stopPropagation()} />

        </div>

      )}



      {/* Explicit confirmation required before parcel creation */}

      {confirmOrder && (

        <div role="dialog" aria-modal="true" aria-labelledby="steadfast-confirm-title" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 sm:p-6" onClick={() => !sendingOrderId && setConfirmOrderId(null)}>

          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 text-[#202020] shadow-2xl sm:p-7" onClick={e => e.stopPropagation()}>

            <div className="flex items-start justify-between gap-3">

              <div>

                <h2 id="steadfast-confirm-title" className="text-lg font-bold">Confirm Steadfast Parcel</h2>

                <p className="mt-1 text-xs text-[#777]">Review all details before creating a real courier parcel.</p>

              </div>

              <button type="button" disabled={!!sendingOrderId} onClick={() => setConfirmOrderId(null)} aria-label="Close confirmation" className="rounded-lg p-2 hover:bg-[#f5f5f5]"><X size={20} /></button>

            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-[#f8f8f8] p-4 text-sm">

              <p><strong>Order ID:</strong> {confirmOrder.orderId}</p>

              <p><strong>Date:</strong> {String(confirmOrder.date || '').replace('T', ' ')}</p>

              <p><strong>Name:</strong> {confirmOrder.customer?.name || '—'}</p>

              <p><strong>Phone:</strong> {confirmOrder.customer?.phone || '—'}</p>

              <p className="break-words"><strong>Email:</strong> {confirmOrder.customer?.email || '—'}</p>

              <p className="break-words"><strong>Address:</strong> {[confirmOrder.customer?.address, confirmOrder.customer?.cityArea].filter(Boolean).join(', ') || '—'}</p>

              <p><strong>Order status:</strong> {confirmOrder.status || '—'}</p>

              <p><strong>Payment:</strong> {confirmOrder.paymentMethod || '—'}</p>

              <p><strong>Source:</strong> {confirmOrder.source || '—'}</p>

              <p className="break-words"><strong>Note:</strong> {confirmOrder.note || '—'}</p>

            </div>

            <h3 className="mb-2 mt-5 text-sm font-bold">Products</h3>

            <div className="divide-y rounded-xl border">

              {(confirmOrder.items || []).map((item, i) => (

                <div key={`${item.productId}-${i}`} className="flex items-center gap-3 p-3 text-xs">

                  {item.image && <img src={item.image} alt="" className="h-11 w-11 rounded-lg object-contain" />}

                  <div className="min-w-0 flex-1"><p className="font-semibold">{item.productName || item.productId}</p><p className="mt-1 text-[#777]">ID: {item.productId} · Qty: {item.quantity} × {money(item.price)}</p></div>

                  <strong>{money(item.subtotal)}</strong>

                </div>

              ))}

            </div>

            <div className="mt-4 space-y-1 text-sm">

              <p className="flex justify-between"><span>Subtotal</span><strong>{money(confirmOrder.subtotal)}</strong></p>

              <p className="flex justify-between"><span>Delivery charge</span><strong>{money(confirmOrder.deliveryCharge)}</strong></p>

              <p className="flex justify-between"><span>Order total</span><strong>{money(confirmOrder.total)}</strong></p>

              <p className="flex justify-between border-t pt-2 text-base"><span>Steadfast COD amount</span><strong>{money(codForOrder(confirmOrder))}</strong></p>

            </div>

            <p className="mt-3 text-xs text-[#777]">The server uses the latest Google Sheet values, not editable browser data. Confirm only after checking the recipient and amount.</p>

            {courierError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{courierError}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <button type="button" disabled={!!sendingOrderId} onClick={() => setConfirmOrderId(null)} className="rounded-xl border px-5 py-3 text-sm font-semibold disabled:opacity-50">Cancel</button>

              <button type="button" disabled={!!sendingOrderId || hasCourierInfo(confirmOrder) || confirmOrder.status === 'Cancelled'} onClick={sendToSteadfast} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">

                {sendingOrderId ? <Loader2 size={17} className="animate-spin" /> : <Truck size={17} />}

                {sendingOrderId ? 'Creating parcel...' : 'Confirm & Create Parcel'}

              </button>

            </div>

          </div>

        </div>

      )}



      <AdminBottomNav

  activeTab={tab}

  onNavigate={navigate}

/>

    </div>

  );

}



'use client';



import { useEffect, useRef, useState } from 'react';

import {

  ImagePlus,

  PackagePlus,

  CheckCircle2,

  Loader2

} from 'lucide-react';



const initial = {

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



// EXISTING API CONNECTION

async function api(payload) {

  const { action, productId, slot } = payload;



  if (process.env.NODE_ENV === 'development') {

    console.info('[product-entry] request', {

      action,

      productId: productId || undefined,

      slot: slot || undefined

    });

  }



  const r = await fetch('/api/product-entry', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify(payload)

  });



  let j;



  try {

    j = await r.json();

  } catch {

    throw new Error(

      `API returned an invalid response (HTTP ${r.status})`

    );

  }



  if (!r.ok || j?.success !== true) {

    throw new Error(

      j?.error || `Request failed (HTTP ${r.status})`

    );

  }



  return j.data ?? j;

}



// WEBP CONVERSION - 82% QUALITY

function toWebp(file) {

  return new Promise((resolve, reject) => {

    const image = new Image();

    const url = URL.createObjectURL(file);



    image.onload = () => {

      URL.revokeObjectURL(url);



      const scale = Math.min(

        1,

        1400 / Math.max(image.width, image.height)

      );



      const canvas = document.createElement('canvas');



      canvas.width = Math.max(

        1,

        Math.round(image.width * scale)

      );



      canvas.height = Math.max(

        1,

        Math.round(image.height * scale)

      );



      const ctx = canvas.getContext('2d');



      if (!ctx) {

        reject(new Error('Canvas is unavailable.'));

        return;

      }



      ctx.fillStyle = '#fff';

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(

        image,

        0,

        0,

        canvas.width,

        canvas.height

      );



      canvas.toBlob(blob => {

        if (!blob || blob.type !== 'image/webp') {

          reject(

            new Error('Could not convert image to WebP.')

          );

          return;

        }



        const reader = new FileReader();



        reader.onload = () => resolve({

          mimeType: 'image/webp',

          base64: String(reader.result).split(',')[1]

        });



        reader.onerror = () =>

          reject(new Error('Could not read image.'));



        reader.readAsDataURL(blob);



      }, 'image/webp', 0.82);

    };



    image.onerror = () => {

      URL.revokeObjectURL(url);

      reject(new Error('Invalid image.'));

    };



    image.src = url;

  });

}



// SAFE DESCRIPTION HTML

function cleanDescriptionHtml(html) {

  const source = document.createElement('template');

  source.innerHTML = String(html || '').slice(0, 30000);



  const out = document.createElement('div');



  const allowed = new Set([

    'P', 'H1', 'H2', 'STRONG', 'EM',

    'U', 'SPAN', 'BR', 'UL', 'OL', 'LI'

  ]);



  const forbidden = new Set([

    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT',

    'EMBED', 'SVG', 'MATH', 'FORM',

    'INPUT', 'TEXTAREA', 'BUTTON'

  ]);



  function appendClean(node, target) {

    if (node.nodeType === Node.TEXT_NODE) {

      target.appendChild(

        document.createTextNode(node.textContent || '')

      );

      return;

    }



    if (

      node.nodeType !== Node.ELEMENT_NODE ||

      forbidden.has(node.nodeName)

    ) {

      return;

    }



    const aliases = {

      B: 'STRONG',

      I: 'EM',

      DIV: 'P',

      FONT: 'SPAN'

    };



    const tag = aliases[node.nodeName] || node.nodeName;



    const el = allowed.has(tag)

      ? document.createElement(tag.toLowerCase())

      : target;



    if (tag === 'SPAN' && el !== target) {

      const color =

        node.style.color ||

        node.getAttribute('color') ||

        '';



      const check = document.createElement('span');

      check.style.color = color;



      const normalized = check.style.color;



      if (

        /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(normalized) ||

        /^rgb\(\d+,\s*\d+,\s*\d+\)$/i.test(normalized)

      ) {

        el.style.color = normalized;

      }

    }



    if (el !== target) target.appendChild(el);



    if (tag !== 'BR') {

      Array.from(node.childNodes).forEach(child =>

        appendClean(child, el)

      );

    }

  }



  Array.from(source.content.childNodes).forEach(node =>

    appendClean(node, out)

  );



  return out.innerHTML;

}



// SHARED RICH TEXT EDITOR

export function DescriptionEditor({

  onChange,

  resetToken,

  initialHtml = ''

}) {

  const editorRef = useRef(null);

  const selectionRef = useRef(null);

  const [color, setColor] = useState('#dc2626');



  useEffect(() => {

    const remember = () => {

      const sel = window.getSelection();



      if (

        sel?.rangeCount &&

        editorRef.current?.contains(sel.anchorNode)

      ) {

        selectionRef.current =

          sel.getRangeAt(0).cloneRange();

      }

    };



    document.addEventListener('selectionchange', remember);



    return () =>

      document.removeEventListener(

        'selectionchange',

        remember

      );

  }, []);



  useEffect(() => {

    if (editorRef.current) {

      editorRef.current.innerHTML =

        cleanDescriptionHtml(initialHtml);

    }



    selectionRef.current = null;

  }, [resetToken, initialHtml]);



  function sync() {

    const editor = editorRef.current;



    onChange(

      editor?.textContent?.trim()

        ? cleanDescriptionHtml(editor.innerHTML)

        : ''

    );

  }



  function restore() {

    editorRef.current?.focus();



    const range = selectionRef.current;



    if (

      range &&

      editorRef.current?.contains(

        range.commonAncestorContainer

      )

    ) {

      const sel = window.getSelection();

      sel.removeAllRanges();

      sel.addRange(range);

    }

  }



  function format(command, value) {

    restore();



    if (command === 'block') {

      document.execCommand(

        'formatBlock',

        false,

        `<${value}>`

      );

    }



    if (

      ['bold', 'italic', 'underline',

       'insertUnorderedList',

       'insertOrderedList'].includes(command)

    ) {

      document.execCommand(command, false);

    }



    if (command === 'color') {

      document.execCommand(

        'styleWithCSS',

        false,

        true

      );



      document.execCommand(

        'foreColor',

        false,

        value

      );

    }



    if (command === 'clear') {

      document.execCommand('removeFormat', false);

    }



    sync();

  }



  const btn = (label, title, command, value) => (

    <button

      type="button"

      title={title}

      onMouseDown={e => e.preventDefault()}

      onClick={() => format(command, value)}

      className="shrink-0 rounded-md border border-[#e5e5e5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#222] hover:bg-[#eee] sm:px-3 sm:py-2"

    >

      {label}

    </button>

  );



  return (

    <div className="min-w-0 space-y-2">

      <label className="block text-sm font-medium text-[#555]">

        Description

      </label>



      <div className="min-w-0 overflow-hidden rounded-xl border border-[#e4e4e4] bg-white focus-within:border-[#171717]">



        <div

          role="toolbar"

          aria-label="Description formatting"

          className="flex flex-wrap items-center gap-1.5 border-b border-[#eaeaea] bg-[#fafafa] p-2"

        >

          {btn('P', 'Paragraph', 'block', 'p')}

          {btn('H1', 'Heading 1', 'block', 'h1')}

          {btn('H2', 'Heading 2', 'block', 'h2')}

          {btn(<b>B</b>, 'Bold', 'bold')}

          {btn(<i>I</i>, 'Italic', 'italic')}

          {btn(<u>U</u>, 'Underline', 'underline')}

          {btn('• List', 'Bullet list', 'insertUnorderedList')}

          {btn('1. List', 'Numbered list', 'insertOrderedList')}



          <div className="mx-1 h-6 w-px bg-[#ddd]" />



          {[

            '#dc2626',

            '#16a34a',

            '#2563eb',

            '#d97706',

            '#7c3aed'

          ].map(c => (

            <button

              key={c}

              type="button"

              aria-label={`Text color ${c}`}

              title={`Text color ${c}`}

              onMouseDown={e => e.preventDefault()}

              onClick={() => format('color', c)}

              style={{ backgroundColor: c }}

              className="h-7 w-7 shrink-0 rounded-md border border-black/10"

            />

          ))}



          <input

            type="color"

            title="Custom text color"

            aria-label="Custom text color"

            value={color}

            onChange={e => {

              setColor(e.target.value);

              format('color', e.target.value);

            }}

            className="h-8 w-9 cursor-pointer rounded border bg-white p-0.5"

          />



          {btn('Clear', 'Clear formatting', 'clear')}

        </div>



        <div

          ref={editorRef}

          contentEditable

          suppressContentEditableWarning

          role="textbox"

          aria-label="Product description"

          aria-multiline="true"

          onInput={sync}

          onPaste={e => {

            e.preventDefault();



            document.execCommand(

              'insertText',

              false,

              e.clipboardData.getData('text/plain')

            );



            sync();

          }}

          className="mahakron-editor min-h-[140px] w-full min-w-0 break-words px-3 py-3 text-sm leading-7 text-[#202020] outline-none sm:min-h-[170px] sm:px-4"

        />

      </div>



      <style jsx>{`

        .mahakron-editor :global(h1) {

          font-size: 1.5rem;

          font-weight: 700;

          line-height: 1.4;

          margin: .5rem 0;

        }



        .mahakron-editor :global(h2) {

          font-size: 1.2rem;

          font-weight: 700;

          line-height: 1.4;

          margin: .5rem 0;

        }



        .mahakron-editor :global(p) {

          margin: .35rem 0;

        }



        .mahakron-editor :global(ul) {

          list-style: disc;

          padding-left: 1.5rem;

        }



        .mahakron-editor :global(ol) {

          list-style: decimal;

          padding-left: 1.5rem;

        }

      `}</style>



      <p className="text-xs text-[#888]">

        Select text to apply headings, bold, lists or colors.

      </p>

    </div>

  );

}



// ADD PRODUCT FORM

export default function AddProductForm({

  standalone = false

}) {

  const [form, setForm] = useState(initial);



  const [

    descriptionResetToken,

    setDescriptionResetToken

  ] = useState(0);



  const [files, setFiles] = useState([

    null, null, null

  ]);



  const [previews, setPreviews] = useState([

    '', '', ''

  ]);



  const [categories, setCategories] = useState([]);

  const [busy, setBusy] = useState(false);

  const [message, setMessage] = useState('');

  const [savedId, setSavedId] = useState('');

  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [uploadedSlots, setUploadedSlots] = useState([]);



  useEffect(() => {

    api({ action: 'productInit' })

      .then(d => setCategories(d.categories || []))

      .catch(e =>

        setMessage(

          'Could not load categories: ' + e.message

        )

      );

  }, []);



  useEffect(() => {

    return () => {

      previews.forEach(url => {

        if (url) URL.revokeObjectURL(url);

      });

    };

  }, [previews]);



  const update = (key, value) =>

    setForm(f => ({

      ...f,

      [key]: value,

      ...(key === 'gender'

        ? { category: '' }

        : {})

    }));



  const available = categories

    .filter(

      c => !c.gender || c.gender === form.gender

    )

    .map(c =>

      typeof c === 'string'

        ? c

        : c.category || c.name

    )

    .filter(Boolean);



  function chooseFile(i, file) {

    if (

      file &&

      (

        !file.type.startsWith('image/') ||

        file.size > 12 * 1024 * 1024

      )

    ) {

      setMessage('Choose an image under 12 MB');

      return;

    }



    setPreviews(old => {

      if (old[i]) URL.revokeObjectURL(old[i]);



      return old.map((v, n) =>

        n === i

          ? file

            ? URL.createObjectURL(file)

            : ''

          : v

      );

    });



    setFiles(old =>

      old.map((v, n) => n === i ? file : v)

    );



    setUploadedSlots(old =>

      old.filter(slot => slot !== i + 1)

    );



    setMessage('');

  }



  async function save(e) {

    e.preventDefault();



    if (busy) return;



    setBusy(true);



    setMessage(

      savedId

        ? 'Preparing pending image uploads...'

        : 'Saving product...'

    );



    let id = savedId;

    const wasAlreadySaved = Boolean(savedId);



    try {

      if (!id) {

        const saved = await api({

          action: 'productSave',

          product: {

            ...form,

            id: ''

          }

        });



        id = saved?.product?.id;



        if (!id) {

          throw new Error(

            'Product saved but Product ID was not returned.'

          );

        }



        setSavedId(id);

      }



      if (!files.some(Boolean)) {

        if (uploadedSlots.length) {

          setMessage(

            `Product ${id} saved. All images uploaded.`

          );

          return;

        }



        if (!wasAlreadySaved) {

          setMessage(

            `Product ${id} saved to Google Sheets. No images selected.`

          );

          return;

        }



        throw new Error(

          `Product ${id} is saved. Select an image to upload.`

        );

      }



      for (let i = 0; i < files.length; i++) {

        if (!files[i]) continue;



        setUploadingSlot(i + 1);



        setMessage(

          `Uploading image ${i + 1} for product ${id}...`

        );



        const converted = await toWebp(files[i]);



        const result = await api({

          action: 'productImage',

          productId: id,

          slot: i + 1,

          fileName: files[i].name,

          ...converted

        });



        if (!result?.url) {

          throw new Error(

            `Image ${i + 1} upload did not return a Cloudinary URL. Image retained for retry.`

          );

        }



        setFiles(old =>

          old.map((v, n) => n === i ? null : v)

        );



        setUploadedSlots(old => [

          ...new Set([...old, i + 1])

        ]);



        setMessage(

          `Image ${i + 1} uploaded successfully for ${id}.`

        );

      }



      setMessage(

        `✓ Product ${id} saved to Google Sheets with all images uploaded to Cloudinary.`

      );



    } catch (err) {

      setMessage(

        `Product ID: ${id || 'not saved'}. ${err.message} Pending images are retained for retry.`

      );

    } finally {

      setUploadingSlot(null);

      setBusy(false);

    }

  }



  function reset() {

    previews.forEach(url => {

      if (url) URL.revokeObjectURL(url);

    });



    setForm(initial);

    setDescriptionResetToken(v => v + 1);

    setFiles([null, null, null]);

    setPreviews(['', '', '']);

    setSavedId('');

    setUploadedSlots([]);

    setUploadingSlot(null);

    setMessage('');

  }



  const inputClass =

    'mt-2 w-full min-w-0 rounded-xl border border-[#e4e4e4] bg-white px-3 py-2.5 text-sm text-[#202020] outline-none focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 sm:px-4 sm:py-3';



  const field = (

    label,

    key,

    type = 'text',

    required = false

  ) => (

    <label className="block min-w-0 text-sm font-medium text-[#555]">

      {label}



      <input

        type={type}

        required={required}

        min={type === 'number' ? 0 : undefined}

        step={type === 'number' ? 'any' : undefined}

        value={form[key]}

        onChange={e =>

          update(key, e.target.value)

        }

        className={inputClass}

      />

    </label>

  );



  return (

    <div

      className={

        standalone

          ? 'min-h-screen min-w-0 bg-[#f7f7f6] px-3 py-5 text-[#202020] sm:px-4 md:py-10'

          : 'w-full min-w-0 text-[#202020]'

      }

    >

      <div className={`mx-auto w-full min-w-0 ${

        standalone ? 'max-w-4xl' : 'max-w-5xl'

      }`}>



        {standalone && (

          <div className="mb-6 flex items-center gap-3">

            <div className="rounded-2xl bg-[#1b1b1b] p-3 text-white">

              <PackagePlus size={24} />

            </div>



            <div>

              <p className="text-xs font-semibold tracking-[.2em] text-[#888]">

                MAHAKRON

              </p>



              <h1 className="text-2xl font-bold sm:text-3xl">

                Add New Product

              </h1>

            </div>

          </div>

        )}



        <form

          onSubmit={save}

          className="min-w-0 space-y-4 sm:space-y-5 md:space-y-6"

        >

          {/* PRODUCT DETAILS */}

          <section className="min-w-0 rounded-2xl border border-[#e7e7e7] bg-white p-3 shadow-sm sm:p-5 md:p-6">

            <h2 className="mb-4 text-base font-bold sm:mb-5 sm:text-lg">

              Product details

            </h2>



            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">

              {field(

                'Product Name *',

                'productName',

                'text',

                true

              )}



              <label className="block min-w-0 text-sm font-medium text-[#555]">

                Gender *



                <select

                  value={form.gender}

                  onChange={e =>

                    update('gender', e.target.value)

                  }

                  className={inputClass}

                >

                  <option>Male</option>

                  <option>Female</option>

                </select>

              </label>



              <label className="block min-w-0 text-sm font-medium text-[#555]">

                Category *



                <select

                  required

                  value={form.category}

                  onChange={e =>

                    update('category', e.target.value)

                  }

                  className={inputClass}

                >

                  <option value="">Select category</option>



                  {[...new Set(available)].map(c => (

                    <option key={c}>{c}</option>

                  ))}

                </select>

              </label>



              {field('Subcategory', 'subcategory')}

              {field('Selling Price *', 'price', 'number', true)}

              {field('Old Price', 'oldPrice', 'number')}

              {field('Purchase Price *', 'purchasePrice', 'number', true)}

              {field('Purchased Quantity *', 'purchasedQty', 'number', true)}



              <label className="block min-w-0 text-sm font-medium text-[#555]">

                Status *



                <select

                  value={form.status}

                  onChange={e =>

                    update('status', e.target.value)

                  }

                  className={inputClass}

                >

                  {[

                    'Active',

                    'Inactive',

                    'Out of Stock'

                  ].map(s => (

                    <option key={s}>{s}</option>

                  ))}

                </select>

              </label>



              <div className="min-w-0 sm:col-span-2">

                <DescriptionEditor

                  resetToken={descriptionResetToken}

                  onChange={value =>

                    update('description', value)

                  }

                />

              </div>

            </div>

          </section>



          {/* COMPACT MOBILE IMAGE UPLOAD */}

          <section className="min-w-0 rounded-2xl border border-[#e7e7e7] bg-white p-3 shadow-sm sm:p-5 md:p-6">

            <h2 className="text-base font-bold sm:text-lg">

              Product images

            </h2>



            <p className="mt-1 text-xs text-[#888] sm:text-sm">

              Up to 3 images · Resized to 1400px · WebP quality 82%

            </p>



            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">

              {[0, 1, 2].map(i => (

                <label

                  key={i}

                  className="flex min-h-[105px] min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#e4e4e4] bg-[#fafafa] p-2 text-center transition hover:border-[#aaa] sm:min-h-[130px] md:min-h-[145px]"

                >

                  {previews[i] ? (

                    <img

                      src={previews[i]}

                      alt={`Image ${i + 1} preview`}

                      className="h-[70px] w-full object-contain sm:h-[95px] md:h-[115px]"

                    />

                  ) : (

                    <ImagePlus

                      className="text-[#999]"

                      size={22}

                    />

                  )}



                  <span className="mt-2 w-full truncate text-[10px] text-[#666] sm:text-xs">

                    Image {i + 1}

                  </span>



                  <span className="w-full truncate text-[9px] text-[#999] sm:text-[11px]">

                    {files[i]

                      ? files[i].name

                      : uploadedSlots.includes(i + 1)

                        ? 'Uploaded'

                        : 'Choose file'}

                  </span>



                  {uploadingSlot === i + 1 && (

                    <span className="mt-1 text-[10px] font-semibold text-[#555]">

                      Uploading...

                    </span>

                  )}



                  <input

                    type="file"

                    accept="image/*"

                    className="hidden"

                    onChange={e =>

                      chooseFile(

                        i,

                        e.target.files?.[0]

                      )

                    }

                  />

                </label>

              ))}

            </div>

          </section>



          {/* STATUS MESSAGE */}

          {message && (

            <div

              role="status"

              className="break-words rounded-xl border border-[#e7e7e7] bg-white px-4 py-3 text-sm sm:px-5 sm:py-4"

            >

              {message}

            </div>

          )}



          {/* ACTION BUTTONS */}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

            <button

              disabled={busy || (Boolean(savedId) && !files.some(Boolean))}

              type="submit"

              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50 sm:w-auto"

            >

              {busy ? (

                <Loader2

                  className="animate-spin"

                  size={18}

                />

              ) : (

                <CheckCircle2 size={18} />

              )}



              {savedId
                 ? files.some(Boolean)
                   ? 'Retry pending images'
                   : 'All images uploaded'
                 : 'Save Product'}

            </button>



            <button

              type="button"

              disabled={busy}

              onClick={reset}

              className="w-full rounded-xl border border-[#ddd] bg-white px-6 py-3 text-sm font-semibold text-[#333] transition hover:bg-[#f7f7f7] sm:w-auto"

            >

              New Product

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

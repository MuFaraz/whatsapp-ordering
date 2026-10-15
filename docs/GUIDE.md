# Bun & Brew Menu: Chalane aur Bechne ki Guide

Ye guide aapke liye hai: system kaise kaam karta hai, client ko demo kaise dena hai, naya restaurant kaise onboard karna hai, aur roz ke admin kaam kaise karne hain.

---

## 1. Aapke Links

| Kya | Link |
| --- | --- |
| Live website | https://whatsapp-ordering-one.vercel.app |
| Demo menu (client ko dikhane ke liye) | https://whatsapp-ordering-one.vercel.app/menu/bun-and-brew-demo |
| Demo dashboard (bina login) | https://whatsapp-ordering-one.vercel.app/demo/dashboard |
| Demo page (dono + QR code) | https://whatsapp-ordering-one.vercel.app/demo |
| Pricing | https://whatsapp-ordering-one.vercel.app/pricing |
| Signup (naya restaurant) | https://whatsapp-ordering-one.vercel.app/signup |
| Code | https://github.com/MuFaraz/whatsapp-ordering |
| Hosting | Vercel → project `whatsapp-ordering` |
| Database | Supabase → project `MuFaraz's Project` |

Demo orders aur "Get started on WhatsApp" buttons **+92 312 8542140** pe jaate hain. Number badalna ho to Vercel → Settings → Environment Variables mein `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER` / `NEXT_PUBLIC_SALES_WHATSAPP_NUMBER` badlein, phir **Redeploy** karein.

---

## 2. System Kaise Chalta Hai (poora flow)

```
Restaurant owner                         Customer (table pe)                  Restaurant ka WhatsApp
─────────────────                        ───────────────────                  ──────────────────────
1. Signup → onboarding
   (naam, link, WhatsApp, currency, logo)
2. Dashboard: categories + items
   (photo, price, available/sold out)
3. QR code download / print
   → tables pe laga diya
                                         4. QR scan → menu phone pe khulta hai
                                            (koi app nahi, koi login nahi)
                                         5. Items cart mein, quantity, dine-in/
                                            takeaway/delivery, table no., notes
                                         6. "Order on WhatsApp" → server prices
                                            dobara check karta hai → message ready
                                         7. WhatsApp khulta hai, message pehle se
                                            likha hota hai → customer "Send" dabata ──→ 8. Order aata hai
                                                                                         9. Restaurant reply karke
                                                                                            confirm karta hai
```

**Ahem baatein jo client ko batani hain:**

- **Order khud nahi jaata.** Customer WhatsApp mein khud "Send" dabata hai, aur restaurant ke reply se hi order confirm hota hai. Customer ko ye baat screen pe likhi hui dikhti hai.
- **Online payment nahi hai.** Payment restaurant apne tareeqe se leta hai (cash, card, JazzCash).
- **Price ya "sold out" badlein to menu pe foran update ho jata hai.** QR dobara print nahi karna parta. Sirf menu ka link (slug) badla jaye to naya QR chahiye.
- **Commission zero.** Customer aur orders restaurant ke apne hain.

---

## 3. Client Ko Demo Kaise Dena Hai (10 minute ka script)

**Tayyari:** phone charged ho, WhatsApp khula ho, aur laptop/tablet pe https://whatsapp-ordering-one.vercel.app/demo khula ho.

1. **Masla poochein (1 min):** "Abhi menu kaise dikhate hain? Price badalte hain to naya menu chhapwana parta hai? Takeaway orders phone pe kaise lete hain?"
2. **Customer wala hissa (3 min):**
   - Owner ko apne phone se `/demo` page wala **QR scan** karwayein.
   - Menu khulega. Unhein dikhayein ke categories hain, photos hain, aur "Sold out" item add nahi hota.
   - 2–3 items cart mein dalwayein, **Dine-in** aur **Table 5** chunwayein, aur note likhwayein ("extra spicy").
   - **"Order on WhatsApp"** dabwayein. Message ready ho jayega, phir **Send** karwayein.
   - **Order aapke phone pe aayega.** Unhein dikhayein ke order kitna saaf likha hai: items, total, table, note.
3. **Owner wala hissa (4 min):** https://whatsapp-ordering-one.vercel.app/demo/dashboard
   - Ek item ki price badal kar dikhayein, phir ek item ko "Sold out" (switch off) karke dikhayein.
   - Naya item add karein: photo upload hogi aur customer preview saath saath dikhega.
   - **QR code** page: download aur **Printable table cards** (1 ya 4 cards ek page pe).
   - Unhein yaqeen dilayein ke demo mein kuch save nahi hota, isliye beshak kuch bhi try karein.
4. **Band karein (2 min):** "PKR 1,000 mahina, koi commission nahi. Aapka menu main aaj hi bana deta hoon, kal se tables pe QR lag jayega."

**Mazboot points:** koi app download nahi, koi commission nahi (Foodpanda 25–30% leta hai), price foran badlo, aur aaj hi shuru ho sakta hai.

---

## 4. Naya Restaurant Onboard Karna (paying client)

**Option A: Client khud kare.** Unhein `/signup` ka link bhejein. 10 minute ka kaam hai.

**Option B: Aap unke liye karein (setup assistance, jis ki alag fees le sakte hain):**

1. https://whatsapp-ordering-one.vercel.app/signup pe **client ke email** se account banayein (taake account unka ho), aur password client ko de dein.
2. Onboarding mein ye bharein:
   - Restaurant ka naam
   - Link, jaise `karachi-grill`. Ye QR mein jata hai, isliye baad mein na badlein.
   - **Restaurant ka WhatsApp number** (+92 se shuru)
   - Currency (PKR)
   - Logo
3. **Categories** banayein (Burgers, Pizza, Drinks…), phir **Menu items** add karein: naam, price, photo, description.
4. **Settings:** cover photo, address/phone, order types (dine-in/takeaway/delivery), aur table number on/off.
5. **QR code → Printable table cards → Print.** Moti card par print karke laminate karwayein ya acrylic stand mein lagayein. QR kam az kam 3×3 cm ka hona chahiye.
6. **Test zaroor karein:** apne phone se QR scan karke ek test order bhejein aur dekhein ke restaurant ke WhatsApp pe aaya ya nahi.
7. Client ko 5 minute sikhayein: price badalna, "sold out" karna aur naya item add karna.

**Note:**
- Ek account = ek restaurant. Do branches ke liye do accounts banayein.
- Signup pe abhi email verification **band** hai, taake demo aur signup foran chalein. Section 7 dekhein.

---

## 5. Pricing (jo website pe likha hai)

| Plan | Price | Kya milta hai |
| --- | --- | --- |
| **Starter** | PKR 1,000 / mahina | Poora digital menu, photos, WhatsApp ordering, QR + print cards, unlimited updates, koi commission nahi |
| **Setup assistance** | Ek dafa ki fees (aap tay karein) | Aap menu enter karte hain, photos lagate hain, cards print karte hain aur staff ko sikhate hain |
| **Custom website** | Alag quote | Apna domain aur poori website, alag project ke taur pe |

**Payment kaise lein:** website pe online payment nahi hai. JazzCash, Easypaisa ya bank transfer se har mahine manually lein, aur ek simple sheet rakhein (restaurant, link, amount, kis tareekh tak paid).

**Mera mashwara (aap ki marzi):** setup fees PKR 3,000–5,000 rakhein, kyunki menu entry aur printing mein waqt lagta hai. Pehle 2–3 clients ko pehla mahina free de kar unke reviews ya video testimonials lein.

---

## 6. Admin ke Kaam (Supabase SQL Editor se)

Abhi admin panel nahi hai. Ye kaam **Supabase → SQL Editor** mein query chala kar hote hain.

**Saare restaurants ki list:**
```sql
select r.name, r.slug, r.whatsapp_number, r.is_published, u.email, r.created_at
from restaurants r join auth.users u on u.id = r.owner_id
order by r.created_at desc;
```

**Payment nahi aayi → menu band karein** (customer ko "menu available nahi" dikhega):
```sql
update restaurants set is_published = false where slug = 'karachi-grill';
```

**Payment aa gayi → menu wapas on:**
```sql
update restaurants set is_published = true where slug = 'karachi-grill';
```
(Owner bhi apne Settings mein "Menu is public" khud on/off kar sakta hai.)

**Client ka password bhool gaya:** login page pe "Forgot password?" use karein. Free plan pe Supabase ghante mein sirf **2 emails** bhejta hai (section 7 dekhein). Fori zaroorat ho to Supabase → Authentication → Users → user chun kar "Send password recovery" karein.

**Account poora delete karna** (restaurant, menu, sab kuch mit jayega; images pehle dashboard se delete kar lein):
```sql
delete from auth.users where email = 'client@email.com';
```

---

## 7. Zyada Clients Se Pehle Ye Zaroor Karein

1. **Supabase token revoke karein:** https://supabase.com/dashboard/account/tokens → "Claude Token" → Revoke. Setup ho chuka hai, ab iski zaroorat nahi.
2. **Apna email bhejne wala service (SMTP) lagayein.** Abhi Supabase ka free email ghante mein sirf 2 email bhejta hai, isliye password reset atak sakta hai.
   - [Resend](https://resend.com) ya [Brevo](https://brevo.com) ka free account banayein, phir Supabase → Project Settings → Authentication → SMTP mein details daalein.
   - Iske baad email verification wapas on kar sakte hain: Authentication → Sign In / Providers → Email → **Confirm email** on.
3. **Vercel Pro (takreeban $20/mahina):** Vercel ka free (Hobby) plan sirf non-commercial kaam ke liye hai. Paise lena shuru karein to Pro le lein.
4. **Supabase:** free project **1 hafte tak koi activity na ho to pause** ho jata hai, aur phir saare menus band ho jate hain. Paying clients aa jayein to **Supabase Pro (takreeban $25/mahina)** le lein; is mein daily backups bhi milte hain.
5. **Kharcha:** dono Pro plans mila kar takreeban $45 mahina (≈ PKR 12,500–13,000) hain, yaani lagbhag **13 clients pe kharcha nikal aata hai**. Us se aage sab munafa hai.
6. **Privacy policy / Terms page:** jab clients barh jayein to ek saada page bana lein.

---

## 8. Code Badalna aur Deploy

- Code badal kar `git push` karein. **Vercel khud deploy kar deta hai** (takreeban 1 minute).
- Environment variable badla ho to Vercel → Deployments → latest → **Redeploy** karein.
- Branding (naam "Bun & Brew Menu") badalni ho to `src/config/site.ts` mein badlein.
- Technical tafseel `README.md` mein hai.

---

## 9. Abhi Kya Nahi Hai (client ko sach batayein)

- Online payment
- Order history ya reports. Orders sirf WhatsApp mein hote hain.
- Staff ke alag accounts. Ek restaurant ka ek login hai.
- Admin panel (upar diye SQL se kaam chalayein)
- Ek account mein kai branches

Ye sab aage paid features ban sakte hain, jab clients maangein.

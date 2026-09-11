/**
 * FAQ dataset (single source: /faq page + in-chat assistant) and a pure
 * instant-match scorer for the chat assistant. i18n-free of React and the
 * Prisma client so it runs in server components, client components and
 * `check:faq` alike.
 */

export type FaqLoc = 'ka' | 'en' | 'ru' | 'de'

export interface FaqQA {
  q: string
  a: string
}

export interface FaqSection {
  title: string
  items: FaqQA[]
}

export const FAQ_SECTIONS: Record<FaqLoc, FaqSection[]> = {
  ka: [
    {
      title: 'უძრავი ქონება საქართველოში',
      items: [
        {
          q: 'სად ვიპოვო უძრავი ქონება საქართველოში?',
          a: 'sivrce არის უძრავი ქონების პლატფორმა საქართველოში: ბინები, სახლები, მიწა და კომერციული ფართები იყიდება, ქირავდება და დღიურად გაიცემა. ძიება დაიწყე მთავარ გვერდზე ან 3D რუკაზე — განცხადებები ვერიფიცირებულია, ფასს კი AI ადარებს ბაზარს.',
        },
        {
          q: 'სად არის ბინები დღიურად თბილისში?',
          a: 'ბინები დღიურად თბილისში იხილე sivrce-ზე განყოფილებაში „დღიურად“ — ფილტრი უბნით (ვაკე, საბურთალო, ძველი თბილისი), თარიღით და ფასით. დააჯავშნე პირდაპირ მესაკუთრესთან ჩატით, გადახდამდე შეამოწმე ვერიფიკაცია.',
        },
        {
          q: 'სად არის ბინები დღიურად საბურთალოზე?',
          a: 'ბინები დღიურად საბურთალოზე — მეტროსთან, კლინიკებთან და ბიზნეს-ცენტრებთან. გახსენი დღიური ქირის გვერდი, აირჩიე უბანი საბურთალო და შეადარე 1–2 ოთახიანი ვარიანტები. ფასი მოცემულია ღამეზე; სეზონში ადრე დაჯავშნა ზოგავს თანხას.',
        },
        {
          q: 'როგორ ვიყიდო ბინა თბილისში — ვაკეში ან საბურთალოზე?',
          a: 'გამოიყენე ძიება ან AI ძიება („იყიდება 2 ოთახიანი ბინა ვაკეში“), მონიშნე ფავორიტები, შეადარე AI ფასის ქულა და დაუკავშირდი მესაკუთრეს ან ვერიფიცირებულ აგენტს. გარიგება შენსა და გამყიდველს შორისაა — sivrce მყიდველს საკომისიოს არ აკისრებს.',
        },
      ],
    },
    {
      title: 'მყიდველებისთვის',
      items: [
        {
          q: 'როგორ ვიყიდო ბინა sivrce-ზე?',
          a: 'გამოიყენე ძიება ან AI ძიება, მონიშნე ფავორიტები, შეადარე ფასები AI შეფასებით და დაუკავშირდი პირდაპირ მესაკუთრეს ან ვერიფიცირებულ აგენტს. გარიგება ხდება შენსა და გამყიდველს შორის — sivrce არ იღებს საკომისიოს მყიდველისგან.',
        },
        {
          q: 'რა არის AI ფასის შეფასება?',
          a: 'ჩვენი ხელოვნური ინტელექტი ადარებს განცხადების ფასს მსგავსი ობიექტების რეალურ მონაცემებს — მდებარეობა, ფართი, მდგომარეობა, სართული — და აჩვენებს ქულას 0-დან 100-მდე. მაღალი ქულა ნიშნავს სამართლიან ან ბაზარზე უკეთეს ფასს.',
        },
        {
          q: 'როგორ დავჯავშნო ტური?',
          a: 'გახსენი განცხადება და დააჭირე „ტურის დაჯავშნა“ — აირჩიე შენთვის მოსახერხებელი დრო კალენდარში. აგენტი ან მესაკუთრე დაადასტურებს ვიზიტს.',
        },
        {
          q: 'რა ვალუტით ჩანს ფასები?',
          a: 'ფასები ნაჩვენებია ლარსა და აშშ დოლარში ერთდროულად. კურსი ფიქსირებულია მხოლოდ საჩვენებლად — საბოლოო ფასი ყოველთვის გამყიდველთან შეთანხმებით დგინდება.',
        },
        {
          q: 'როგორ გამოვიყენო AI ძიება?',
          a: 'მთავარი გვერდის ძიების ველში ჩაწერე თავისუფალი ტექსტი — მაგალითად „ოროთახიანი ბინა ვაკეში 200 ათასამდე“. AI გაიგებს შენს მოთხოვნას და აჩვენებს შესაბამის განცხადებებს. მუშაობს ქართულად, ინგლისურად და რუსულად.',
        },
      ],
    },
    {
      title: 'გამყიდველებისთვის',
      items: [
        {
          q: 'უფასოა განცხადების დამატება?',
          a: 'დიახ, სტანდარტული განცხადების განთავსება სრულიად უფასოა და აქტიური რჩება 30 დღის განმავლობაში. დამატებითი ხილვადობისთვის შეგიძლია აირჩიო VIP პაკეტებიდან ერთ-ერთი.',
        },
        {
          q: 'რას იძლევა VIP პაკეტი?',
          a: 'VIP პაკეტები ზრდის შენი განცხადების ხილვადობას: VIP ანიჭებს გამორჩეულ ნიშანს და ძიებაში უპირატეს ადგილს, VIP+ მოექცევა მთავარი გვერდის კარუსელში, ხოლო SUPER VIP იძლევა მაქსიმალურ ხილვადობას — საშუალოდ 5× მეტ ნახვას.',
        },
        {
          q: 'რა არის ბუსტი და სტიკერები?',
          a: 'ბუსტი არის დამატებითი ხილვადობა VIP-ის გარდა: განახლება, ფერი, სთორი, Facebook და Turbo. ფასიანი სტიკერები მხოლოდ ორია — „სასწრაფოდ“ და „ფასი დაწეულია“. სთორი ათავსებს განცხადებას მთავარი გვერდის Stories ზოლში (1 დღე). აუზი, პარკინგი, ავეჯი და სხვა მახასიათებლები უფასოდ რჩება.',
        },
        {
          q: 'როგორ მუშაობს ვერიფიკაცია?',
          a: 'ვერიფიკაციისთვის აგენტი ან მესაკუთრე ატვირთავს პირადობის დამადასტურებელ დოკუმენტს და ქონების საკადასტრო მონაცემებს. ჩვენი გუნდი ამოწმებს ინფორმაციას 1-2 სამუშაო დღეში და წარმატებული შემოწმების შემდეგ განცხადებას ენიჭება ვერიფიცირებული ნიშანი.',
        },
        {
          q: 'შემიძლია რემონტის ან იურიდიული სერვისის გამოქვეყნება?',
          a: 'დიახ. sivrce-ზე არის სერვისების ბაზარი — რემონტი, ინტერიერი, ფოტო და 3D, იურისტი, შეფასება, გადატანა, დასუფთავება, ქონების მართვა. კომპანია აქვეყნებს სერვისს /add-service-ზე და ქონების განცხადებას იმავე ანგარიშით /add-listing-ზე. ორივე ჩანს კომპანიის პროფილზე.',
        },
      ],
    },
    {
      title: 'პლატფორმის შესახებ',
      items: [
        {
          q: 'რომელ ქალაქებში მუშაობს sivrce?',
          a: 'დღეს sivrce ფარავს საქართველოს 12 ქალაქს — თბილისი, ბათუმი, ქუთაისი, რუსთავი, გორი, ფოთი, ზუგდიდი, თელავი, ახალციხე და სხვა. სია მუდმივად იზრდება.',
        },
        {
          q: 'უსაფრთხოა პირდაპირი კონტაქტი?',
          a: 'დიახ. ყველა აგენტი, ვისთანაც ლაპარაკობ, გაივლის ვერიფიკაციას. შეტყობინებები ხდება პლატფორმის შიგნით, რაც ინახავს მიმოწერის ისტორიას და გიცავს თაღლითობისგან. არასდროს გადაურიცხო ფული პირად შეხვედრამდე.',
        },
      ],
    },
  ],
  en: [
    {
      title: 'Real estate in Georgia',
      items: [
        {
          q: 'Where can I find real estate in Georgia?',
          a: 'sivrce is a Georgian real-estate platform: apartments, houses, land and commercial spaces for sale, rent and daily stay. Start from the home page or the 3D map — listings are verified, and AI scores each price against the market.',
        },
        {
          q: 'Where are daily rentals in Tbilisi?',
          a: 'Find daily apartments in Tbilisi in the “Daily” section — filter by neighborhood (Vake, Saburtalo, Old Tbilisi), dates and price. Book directly with the owner in chat and check verification before paying.',
        },
        {
          q: 'Where are daily rentals in Saburtalo?',
          a: 'Daily apartments in Saburtalo sit near the metro, clinics and business centers. Open the daily rental page, pick the Saburtalo neighborhood and compare 1–2 bedroom options. Prices are per night; booking early in high season saves money.',
        },
        {
          q: 'How do I buy an apartment in Tbilisi — Vake or Saburtalo?',
          a: 'Use search or AI search (“2-bedroom apartment for sale in Vake”), save favorites, compare AI price scores and contact the owner or a verified agent. The deal is between you and the seller — sivrce charges buyers no commission.',
        },
      ],
    },
    {
      title: 'For buyers',
      items: [
        {
          q: 'How do I buy an apartment on sivrce?',
          a: 'Use search or AI search, save favorites, compare prices with AI estimates and contact the owner or a verified agent directly. The deal happens between you and the seller — sivrce takes no buyer commission.',
        },
        {
          q: 'What is the AI price estimate?',
          a: 'Our AI compares a listing’s price against real data from similar properties — location, area, condition, floor — and shows a score from 0 to 100. A high score means a fair or better-than-market price.',
        },
        {
          q: 'How do I book a tour?',
          a: 'Open a listing and tap “Book a tour” — pick a time that suits you in the calendar. The agent or owner confirms the visit.',
        },
        {
          q: 'Which currency are prices shown in?',
          a: 'Prices are shown in GEL and US dollars at the same time. The rate is fixed for display purposes — the final price is always agreed with the seller.',
        },
        {
          q: 'How do I use AI search?',
          a: 'Type free text into the home-page search field — for example “2-bedroom apartment in Vake under $200k”. The AI parses your request and shows matching listings. It works in Georgian, English and Russian.',
        },
      ],
    },
    {
      title: 'For sellers',
      items: [
        {
          q: 'Is adding a listing free?',
          a: 'Yes, publishing a standard listing is completely free and stays active for 30 days. For extra visibility you can choose one of the VIP packages.',
        },
        {
          q: 'What does a VIP package include?',
          a: 'VIP packages boost your listing’s visibility: VIP adds a distinctive badge and priority placement in search, VIP+ puts it in the home-page carousel, and SUPER VIP gives maximum exposure — on average 5× more views.',
        },
        {
          q: 'What are boosts and stickers?',
          a: 'Boosts are extra visibility beyond VIP: refresh, color, story, Facebook and Turbo. Only two stickers are paid — “Urgent” and “Price drop”. Story places your listing in the home-page Stories strip for one day. Pool, parking, furniture and other amenities stay free.',
        },
        {
          q: 'How does verification work?',
          a: 'To get verified, an agent or owner uploads an ID document and the property’s cadastre details. Our team checks the information within 1–2 business days; after a successful check the listing receives a verified badge.',
        },
        {
          q: 'Can I publish a renovation or legal service?',
          a: 'Yes. sivrce has a services marketplace — renovation, interiors, photo & 3D, lawyer, valuation, moving, cleaning, property management. A company publishes a service on /add-service and property listings with the same account on /add-listing. Both appear on the company profile.',
        },
      ],
    },
    {
      title: 'About the platform',
      items: [
        {
          q: 'Which cities does sivrce cover?',
          a: 'Today sivrce covers 12 Georgian cities — Tbilisi, Batumi, Kutaisi, Rustavi, Gori, Poti, Zugdidi, Telavi, Akhaltsikhe and more. The list keeps growing.',
        },
        {
          q: 'Is direct contact safe?',
          a: 'Yes. Every agent you talk to passes verification. Messaging happens inside the platform, which keeps your chat history and protects you from fraud. Never transfer money before meeting in person.',
        },
      ],
    },
  ],
  ru: [
    {
      title: 'Недвижимость в Грузии',
      items: [
        {
          q: 'Где искать недвижимость в Грузии?',
          a: 'sivrce — платформа недвижимости в Грузии: квартиры, дома, земля и коммерческие площади продаются, сдаются и сдаётся посуточно. Начните с главной страницы или 3D-карты — объявления верифицированы, а ИИ сравнивает цену с рынком.',
        },
        {
          q: 'Где посуточные квартиры в Тбилиси?',
          a: 'Посуточные квартиры в Тбилиси — в разделе «Посуточно»: фильтр по кварталу (Ваке, Сабуртало, Старый Тбилиси), датам и цене. Бронируйте напрямую с владельцем в чате и проверяйте верификацию до оплаты.',
        },
        {
          q: 'Где посуточные квартиры в Сабуртало?',
          a: 'Посуточные квартиры в Сабуртало — у метро, клиник и бизнес-центров. Откройте страницу посуточной аренды, выберите квартал Сабуртало и сравните варианты с 1–2 спальнями. Цена за ночь; раннее бронирование в сезон экономит деньги.',
        },
        {
          q: 'Как купить квартиру в Тбилиси — в Ваке или Сабуртало?',
          a: 'Используйте поиск или ИИ-поиск («2-комнатная квартира в Ваке»), отмечайте избранное, сравнивайте ИИ-оценку цены и обращайтесь к владельцу или верифицированному агенту. Сделка между вами и продавцом — sivrce не берёт комиссию с покупателя.',
        },
      ],
    },
    {
      title: 'Покупателям',
      items: [
        {
          q: 'Как купить квартиру на sivrce?',
          a: 'Используйте поиск или ИИ-поиск, отмечайте избранное, сравнивайте цены с ИИ-оценкой и пишите напрямую владельцу или верифицированному агенту. Сделка происходит между вами и продавцом — sivrce не берёт комиссию с покупателя.',
        },
        {
          q: 'Что такое ИИ-оценка цены?',
          a: 'Наш ИИ сравнивает цену объявления с реальными данными похожих объектов — расположение, площадь, состояние, этаж — и показывает оценку от 0 до 100. Высокая оценка означает справедливую или лучшую рыночную цену.',
        },
        {
          q: 'Как забронировать тур?',
          a: 'Откройте объявление и нажмите «Забронировать просмотр» — выберите удобное время в календаре. Агент или владелец подтвердит визит.',
        },
        {
          q: 'В какой валюте показываются цены?',
          a: 'Цены показываются одновременно в лари и долларах США. Курс зафиксирован для отображения — окончательная цена всегда согласуется с продавцом.',
        },
        {
          q: 'Как пользоваться ИИ-поиском?',
          a: 'Введите свободный текст в поле поиска на главной — например «2-комнатная квартира в Ваке до 200 тысяч». ИИ разберёт запрос и покажет подходящие объявления. Работает на грузинском, английском и русском.',
        },
      ],
    },
    {
      title: 'Продавцам',
      items: [
        {
          q: 'Добавление объявления бесплатное?',
          a: 'Да, публикация стандартного объявления полностью бесплатна и остаётся активной 30 дней. Для дополнительной видимости можно выбрать один из VIP-пакетов.',
        },
        {
          q: 'Что даёт VIP-пакет?',
          a: 'VIP-пакеты повышают видимость объявления: VIP даёт особый бейдж и приоритет в поиске, VIP+ попадает в карусель на главной, а SUPER VIP даёт максимальную видимость — в среднем в 5× больше просмотров.',
        },
        {
          q: 'Что такое бусты и стикеры?',
          a: 'Бусты — дополнительная видимость помимо VIP: обновление, цвет, стори, Facebook и Turbo. Платных стикеров только два — «Срочно» и «Цена снижена». Стори размещает объявление в ленте Stories на главной (1 день). Бассейн, парковка, мебель и другие удобства остаются бесплатными.',
        },
        {
          q: 'Как работает верификация?',
          a: 'Для верификации агент или владелец загружает документ, удостоверяющий личность, и кадастровые данные объекта. Наша команда проверяет информацию в течение 1–2 рабочих дней; после успешной проверки объявление получает значок верификации.',
        },
        {
          q: 'Можно ли опубликовать ремонт или юридическую услугу?',
          a: 'Да. На sivrce есть маркет услуг — ремонт, интерьеры, фото и 3D, юрист, оценка, переезд, уборка, управление недвижимостью. Компания публикует услугу на /add-service и объявления о недвижимости с того же аккаунта на /add-listing. Оба видны в профиле компании.',
        },
      ],
    },
    {
      title: 'О платформе',
      items: [
        {
          q: 'В каких городах работает sivrce?',
          a: 'Сегодня sivrce покрывает 12 городов Грузии — Тбилиси, Батуми, Кутаиси, Рустави, Гори, Поти, Зугдиди, Телави, Ахалцихе и другие. Список постоянно растёт.',
        },
        {
          q: 'Безопасен ли прямой контакт?',
          a: 'Да. Каждый агент проходит верификацию. Переписка происходит внутри платформы — это сохраняет историю сообщений и защищает от мошенничества. Никогда не переводите деньги до личной встречи.',
        },
      ],
    },
  ],
  de: [
    {
      title: 'Immobilien in Georgien für Deutsche',
      items: [
        {
          q: 'Können Deutsche in Georgien Immobilien kaufen?',
          a: 'Ja — Wohnungen, Häuser, Gewerbeflächen und nicht-landwirtschaftliche Grundstücke dürfen Ausländer wie Georgier kaufen. Ausgenommen ist Agrarland (Agrarlandgesetz). Sie brauchen nur einen Reisepass; der Kaufvertrag ist schriftlich und wird im öffentlichen Register eingetragen — das Eigentum entsteht erst mit der Eintragung (1–4 Tage, Public Service Hall oder Notar). Ohne Georgischkenntnisse ist ein Dolmetscher Pflicht. Bei Dorfhäusern unbedingt die Bodenkategorie im Registerauszug prüfen: Der Hof ist oft als Agrarland eingetragen.',
        },
        {
          q: 'Brauche ich als Deutscher ein Visum für Georgien?',
          a: 'Nein — deutsche Staatsbürger reisen visumfrei ein (Reisepass oder Personalausweis genügt) und dürfen bis zu einem Jahr bleiben. Stand 2026.',
        },
        {
          q: 'Kann ich aus Deutschland heraus kaufen?',
          a: 'Ja, per Vollmacht — viele Käufer schließen aus der Ferne ab. Gezahlt wird per Banküberweisung oder Treuhandkonto (Escrow); der neue Registerauszug bestätigt Ihr Eigentum. Für die Objektauswahl nutzen Sie geprüfte Inserate, 3D-Karte und KI-Preischeck auf sivrce.',
        },
        {
          q: 'Welche Kaufnebenkosten fallen in Georgien an?',
          a: 'Deutlich weniger als in Deutschland: Notar und Registereintrag kosten zusammen meist 150–300 $, die Übertragungsgebühr beträgt 1 % auf die ersten 100.000 Lari und 2 % darüber. Makler nehmen 1–3 %, die jährliche Grundsteuer ist niedrig. Auf sivrce stehen die Preise in $ — das erleichtert den Vergleich. Die genaue Summe nennt Ihr Notar. Stand 2026.',
        },
        {
          q: 'Gibt es eine Aufenthaltserlaubnis durch Immobilienkauf?',
          a: 'Ja, ab etwa 100.000 $ Immobilienwert ist eine Aufenthaltserlaubnis möglich — dafür ist ein geprüftes Wertgutachten nötig. Voraussetzungen ändern sich; klären Sie Details vor dem Kauf mit Anwalt oder Behörde. Stand 2026.',
        },
        {
          q: 'Worauf muss ich beim Dorfhaus mit Grundstück achten?',
          a: 'Vor jeder Anzahlung den Registerauszug prüfen: Welche Bodenkategorie hat das Grundstück? Wohn- und Hofgebäude sind unproblematisch, der umliegende Hof ist aber häufig als Agrarland eingetragen — das dürfen Ausländer nicht direkt kaufen. Lösung: nur die als Nicht-Agrarland eingetragene Fläche kaufen oder eine georgische Gesellschaft gründen. Geprüfte sivrce-Inserate weisen die Kataster-Nr. aus.',
        },
      ],
    },
    {
      title: 'In Berlin kaufen (sivrce.de)',
      items: [
        {
          q: 'Was kostet der Kauf in Berlin neben dem Kaufpreis?',
          a: 'In Berlin fallen 6 % Grunderwerbsteuer an (zuständig: Finanzamt Spandau) — dazu Notar- und Grundbuchkosten. Ins Grundbuch werden Sie erst eingetragen, wenn die Steuer gezahlt ist (Unbedenklichkeitsbescheinigung). Rechnen Sie grob mit rund 10 % Nebenkosten auf den Kaufpreis; die genaue Summe nennt Ihr Notar.',
        },
        {
          q: 'Wie hoch sind die Kaufnebenkosten mit und ohne Makler?',
          a: 'Ohne Makler liegen die Nebenkosten in Berlin bei rund 8 %: 6 % Grunderwerbsteuer plus etwa 2 % für Notar und Grundbuch. Mit Makler kommen rund 3,57 % Käuferprovision dazu (seit 2020 teilen sich Käufer und Verkäufer die Provision) — insgesamt also rund 11–12 %. Zum Vergleich: In Bayern sind es nur 3,5 % Steuer, in Hamburg 5,5 %. Stand 2026.',
        },
        {
          q: 'Dürfen Ausländer in Berlin eine Wohnung kaufen?',
          a: 'Ja — in Deutschland gibt es keine Beschränkung für ausländische Käufer. Der Kauf wird von einem unabhängigen Notar beurkundet, das Eigentum ins Grundbuch eingetragen.',
        },
        {
          q: 'Wie läuft der Kauf in Berlin Schritt für Schritt ab?',
          a: 'Angebot annehmen, Notartermin (der Notar verliest den Vertrag vollständig), Auflassungsvormerkung zu Ihrem Schutz, Zahlung nach Fälligkeitsmitteilung, Grunderwerbsteuer zahlen, Unbedenklichkeitsbescheinigung abwarten, Umschreibung im Grundbuch — vom Notartermin bis zum Grundbucheintrag dauert es oft 6–12 Wochen, mit Bankfinanzierung länger. Erst der Grundbucheintrag macht Sie zum Eigentümer.',
        },
        {
          q: 'Was ist der Energieausweis und worauf muss ich achten?',
          a: 'Beim Kauf muss Ihnen der Energieausweis spätestens bei der Besichtigung vorliegen — Pflicht. Es gibt Bedarfs- und Verbrauchsausweis mit den Klassen A+ bis H. Eine schlechte Klasse bedeutet hohe Heizkosten und drohende Sanierungspflichten (Heizung, Dämmung); Banken und KfW bepreisen das mit. Vergleichen Sie immer Kennwert und Ausweisart, nicht nur die Farbe.',
        },
        {
          q: 'Was bedeuten WEG, Hausgeld und Erhaltungsrücklage?',
          a: 'Eigentumswohnungen gehören einer Wohnungseigentümergemeinschaft (WEG): Sie zahlen monatliches Hausgeld (Betriebskosten plus Rücklage) und stimmen über Sanierungen mit ab. Vor dem Kauf Teilungserklärung, Wirtschaftsplan und die letzten Versammlungsprotokolle lesen — eine leere Erhaltungsrücklage bei marodem Dach wird Ihre Sonderumlage. Fragen Sie gezielt nach geplanten Maßnahmen.',
        },
        {
          q: 'Wie finanziere ich als Deutscher — und was ist KfW?',
          a: 'Üblich sind 10–20 % Eigenkapital plus Nebenkosten aus Eigenmitteln; Banken prüfen Einkommen, SCHUFA und Objektwert. Die KfW fördert energieeffiziente Käufe und Sanierungen über zinsgünstige Kredite und Zuschüsse — ob Ihr Objekt die Effizienzhaus-Stufe (z. B. EH 40/55, QNG-Siegel) erfüllt, entscheidet über die Förderung. Konditionen ändern sich laufend: KfW und mindestens zwei Hausbanken vergleichen. Stand 2026.',
        },
      ],
    },
    {
      title: 'In Berlin mieten',
      items: [
        {
          q: 'Was ist der Unterschied zwischen Kaltmiete und Warmmiete?',
          a: 'Die Kaltmiete ist die reine Raummiete, die Warmmiete enthält Heizung und Betriebskosten. Vergleichen Sie immer dieselbe Größe — eine günstige Kaltmiete mit 200 € Nebenkosten ist teurer als gedacht. Fragen Sie nach der letzten Betriebskostenabrechnung: Hohe Nachzahlungen verraten schlecht gedämmte Häuser.',
        },
        {
          q: 'Wie hoch darf die Kaution in Berlin sein?',
          a: 'Maximal drei Monatskaltmieten — mehr ist unzulässig, egal was im Vertrag steht. Sie dürfen in drei Monatsraten zahlen, und der Vermieter muss das Geld getrennt von seinem Vermögen anlegen. Lassen Sie sich das Kautionskonto schriftlich bestätigen.',
        },
        {
          q: 'Was sind Mietspiegel und Mietpreisbremse?',
          a: 'Der (qualifizierte) Mietspiegel zeigt die ortsübliche Vergleichsmiete je Lage und Baujahr — prüfen Sie jedes Angebot dagegen. Bei Wiedervermietung gilt in Berlin die Mietpreisbremse: maximal 10 % über Vergleichsmiete. Ausnahmen: Neubau (erstmals nach Oktober 2014 bezugsfertig) und umfassend modernisierte Erstvermietung. Liegt die Miete deutlich darüber, können Sie nach Einzug rügen und zu viel Gezahltes zurückfordern.',
        },
        {
          q: 'Brauche ich eine SCHUFA für eine Berliner Wohnung?',
          a: 'Praktisch ja — fast alle Vermieter verlangen SCHUFA-Auskunft plus Einkommensnachweise (meist drei Monatsgehälter) und Mietschuldenfreiheitsbescheinigung vom Vorvermieter. Ohne SCHUFA helfen Arbeitsvertrag, Bürgschaft oder höheres Einkommen, aber planen Sie deutlich mehr Zeit ein. Besichtigungstermine mit vollständiger Mappe bekommen den Zuschlag.',
        },
      ],
    },
    {
      title: 'Sivrce nutzen',
      items: [
        {
          q: 'Wie kontaktiere ich Eigentümer oder Makler?',
          a: 'Inserat öffnen und anrufen, per WhatsApp schreiben oder einen Besichtigungstermin buchen. Jeder Makler ist verifiziert; der Chat auf der Plattform dokumentiert die Absprachen. Zahlen Sie niemals vor der Besichtigung.',
        },
        {
          q: 'Was kostet das Inserieren?',
          a: 'Ein Standardinserat ist kostenlos und in 3 Minuten online. Mehr Sichtbarkeit bringen VIP, VIP+ und SUPER VIP — direkt in der Inseratsverwaltung buchbar.',
        },
        {
          q: 'Was bedeutet der KI-Preischeck auf sivrce?',
          a: 'Die KI vergleicht den Angebotspreis mit echten Vergleichsobjekten — Lage, Fläche, Zustand, Etage — und zeigt eine Punktzahl von 0 bis 100. Eine hohe Punktzahl heißt fairer oder unterdurchschnittlicher Marktpreis; nutzen Sie das als Verhandlungsargument, nicht als Gutachten.',
        },
        {
          q: 'Was zeigt die 3D-Karte?',
          a: 'Jedes Gebäude anwählbar: Lage, Umkreis, Sonnenverlauf und Schatten über den Tag. In Georgien zusätzlich die offizielle Katastergrenze (NAPR) per Kataster-Nr. — so sehen Sie vor der Reise, was Sie wirklich kaufen.',
        },
      ],
    },
  ]
}

/** ka/ru/de read their native dataset; every other UI language reads English (same rule as dirLoc). */
export function faqLoc(lang: string): FaqLoc {
  return lang === 'ka' ? 'ka' : lang === 'ru' ? 'ru' : lang === 'de' ? 'de' : 'en'
}

// ---------------------------------------------------------------------------
// Instant assistant matching
// ---------------------------------------------------------------------------

// ponytail: exact-token overlap, no stemming/embeddings — Georgian has no
// practical stemmer and this stays instant + offline. Upgrade path: rerank
// with embeddings served from the AI catch-all if miss-rate ever hurts.
const STOPWORDS = new Set([
  'რა', 'როგორ', 'სად', 'არის', 'არ', 'რომელი', 'რატომ', 'შემიძლია', 'შეიძლება', 'თუ', 'და', 'ან', 'კი', 'რას', 'რომ',
  'the', 'a', 'an', 'how', 'what', 'where', 'which', 'why', 'is', 'are', 'can', 'do', 'does', 'i', 'to', 'on', 'in', 'for', 'of', 'it', 'my', 'me',
  'как', 'что', 'где', 'это', 'какой', 'какая', 'почему', 'можно', 'ли', 'и', 'или', 'в', 'на', 'для', 'я', 'мне', 'меня', 'не', 'за', 'до',
  'der', 'die', 'das', 'und', 'oder', 'für', 'mit', 'von', 'zu', 'zum', 'zur', 'im', 'in', 'den', 'dem', 'des', 'ist', 'sind', 'wie', 'was', 'wo', 'kann', 'ich', 'mir', 'mich', 'eine', 'einer', 'einen', 'einem', 'eines', 'auf', 'auch', 'nicht', 'bei', 'als', 'ein', 'eine',
])

function tokens(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(' ')
        .filter((w) => w.length > 1 && !STOPWORDS.has(w)),
    ),
  ]
}

const TOKENS_BY_LOC: Partial<Record<FaqLoc, string[][][]>> = {}

/** [section][item] → merged q+a token vocabulary. */
function questionTokens(loc: FaqLoc): string[][][] {
  let set = TOKENS_BY_LOC[loc]
  if (!set) {
    set = FAQ_SECTIONS[loc].map((s) =>
      s.items.map((item) => [...tokens(item.q), ...tokens(item.a)]),
    )
    TOKENS_BY_LOC[loc] = set
  }
  return set
}

/** Minimum fraction of content tokens a question must cover to answer. */
const MATCH_THRESHOLD = 0.5

/**
 * Best FAQ answer for a free-typed question, or null when nothing covers it.
 * Scores token overlap against question+answer vocabulary; ties keep the
 * earlier (more general) entry.
 */
export function faqMatch(query: string, loc: FaqLoc): FaqQA | null {
  const queryTokens = tokens(query)
  if (queryTokens.length === 0) return null

  let best: FaqQA | null = null
  let bestScore = 0

  FAQ_SECTIONS[loc].forEach((section, si) => {
    section.items.forEach((item, ii) => {
      const vocab = questionTokens(loc)[si][ii]
      let hits = 0
      for (const w of queryTokens) if (vocab.includes(w)) hits++
      const score = hits / queryTokens.length
      if (score >= MATCH_THRESHOLD && score > bestScore) {
        best = item
        bestScore = score
      }
    })
  })

  return best
}

/** Round-robin pick of the most general questions — the assistant's chips. */
export function faqSuggestions(loc: FaqLoc, count = 6): FaqQA[] {
  const out: FaqQA[] = []
  const sections = FAQ_SECTIONS[loc]
  for (let depth = 0; out.length < count; depth++) {
    let added = false
    for (const s of sections) {
      if (s.items[depth]) {
        out.push(s.items[depth])
        added = true
        if (out.length === count) break
      }
    }
    if (!added) break
  }
  return out
}

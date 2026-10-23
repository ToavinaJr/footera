import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'mg' | 'en' | 'fr';

const messages = {
  fr: {
    'language.label': 'Langue',
    'language.malagasy': 'Malagasy',
    'language.english': 'Anglais',
    'language.french': 'Français',
    'common.loading': 'Chargement…',
    'common.loadingSession': 'Chargement de votre session…',
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.search': 'Rechercher',
    'nav.open': 'Ouvrir le menu de navigation',
    'nav.searchPlaceholder': 'Rechercher un joueur, une équipe…',
    'nav.stats': 'Stats & Buteurs',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Accéder à mon espace personnel',
    'nav.logout': 'Se déconnecter',
    'auth.logoutTitle': 'Confirmer la déconnexion',
    'auth.logoutSubtitle': 'Vous pourrez vous reconnecter à tout moment.',
    'auth.logoutPrompt': 'Voulez-vous vraiment vous déconnecter de votre compte ?',
    'auth.logoutConfirm': 'Oui, me déconnecter',
    'auth.logoutError': 'La déconnexion a échoué.',
    'auth.login': 'Se connecter',
    'auth.register': 'Créer un compte',
    'auth.brandSubtitle': 'Votre espace football',
    'auth.welcomeBack': 'Bon retour',
    'auth.joinCommunity': 'Rejoignez la communauté Footera.',
    'auth.signInPrompt': 'Connectez-vous pour accéder à votre espace.',
    'auth.name': 'Nom complet',
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.passwordMinimum': '12 caractères minimum.',
    'auth.showPassword': 'Afficher le mot de passe',
    'auth.hidePassword': 'Masquer le mot de passe',
    'auth.wait': 'Veuillez patienter…',
    'auth.createAccount': 'Créer mon compte',
    'auth.haveAccount': 'Vous avez déjà un compte ?',
    'auth.noAccount': 'Pas encore de compte ?',
    'auth.genericError': 'Impossible de vous authentifier.',
    'landing.loading': 'Chargement…',
    'nav.home': 'Accueil', 'nav.players': 'Joueurs', 'nav.matches': 'Matchs', 'nav.mobile': 'Navigation mobile',
    'nav.profileShort': 'Profil', 'nav.teamsMatches': 'Matchs et compétitions', 'nav.tournaments': 'Tournois',
    'nav.pitches': 'Terrains', 'nav.marketplace': 'Marketplace', 'nav.recruitment': 'Mercato',
    'nav.closeMenu': 'Fermer le menu', 'nav.sidebar': 'Menu latéral Footera',
    'notifications.title': 'Centre d’alertes', 'notifications.markAll': 'Tout marquer comme lu',
    'notifications.readAll': 'Tout lire', 'notifications.close': 'Fermer le volet', 'notifications.empty': 'Aucune notification pour le moment.',
    'common.closeNotification': 'Fermer la notification', 'common.closeDialog': 'Fermer la boîte de dialogue',
    'upload.imageError': 'Échec de l’envoi de l’image.', 'upload.inProgress': 'Envoi en cours…',
    'upload.photoInProgress': 'Envoi de la photo en cours', 'upload.formats': 'PNG, JPEG ou WebP · 5 Mo max',
    'demo.mode': 'Mode', 'demo.banner': 'Données de football réactives et interactives',
    'demo.resetTitle': 'Synchroniser les données de démonstration depuis le backend', 'demo.reset': 'Synchroniser la démo',
    'market.title': 'Marketplace Football', 'market.subtitle': 'Achetez et vendez vos crampons, maillots collectors, ballons et équipements de match.',
    'market.sell': 'Vendre un équipement', 'market.search': 'Rechercher par modèle, marque, ville…', 'market.filter': 'Filtrer par catégorie d’équipement',
    'market.allCategories': 'Toutes les catégories', 'market.emptyTitle': 'Aucun équipement en vente', 'market.emptyDescription': 'Soyez le premier à publier une annonce dans cette catégorie !',
    'market.sellerVerified': 'Vendeur vérifié', 'market.contact': 'Contacter le vendeur pour convenir d’une remise', 'market.createSubtitle': 'Publiez votre article dans la marketplace de la communauté',
    'market.itemTitle': 'Titre de l’article *', 'market.itemExample': 'Ex. : crampons taille 43', 'market.category': 'Catégorie *', 'market.chooseCategory': 'Choisir une catégorie',
    'market.price': 'Prix de vente (€) *', 'market.condition': 'État de l’article *', 'market.chooseCondition': 'Choisir un état', 'market.city': 'Ville de remise *',
    'market.cityExample': 'Ex. : Antananarivo', 'market.brand': 'Marque *', 'market.chooseBrand': 'Choisir une marque', 'market.description': 'Description et détails de l’article',
    'market.descriptionHint': 'Précisez la taille, la couleur et l’historique d’utilisation…', 'market.photo': 'Photo de l’article *', 'market.importPhoto': 'Importer une photo',
    'market.sellerRoleRequired': 'Le rôle Vendeur est requis pour importer une image.', 'market.cancel': 'Annuler', 'market.publishing': 'Publication…', 'market.publish': 'Publier mon annonce',
    'market.required': 'Veuillez renseigner tous les champs obligatoires et choisir une photo.', 'market.invalidPrice': 'Veuillez indiquer un prix valide supérieur à 0.',
    'market.created': 'Votre article a été publié avec succès !', 'market.createError': 'Erreur lors de la mise en vente', 'market.contactSent': 'Message transmis à {seller} !',
    'landing.brand': 'Footera — accueil', 'landing.login': 'Se connecter', 'landing.connectedFootball': 'Le football, connecté',
    'landing.titleLead': 'Tout le football local,', 'landing.titleAccent': 'au même endroit.',
    'landing.description': 'Footera rassemble joueurs, clubs, matchs, tournois et terrains dans une seule plateforme. Organisez votre saison, trouvez votre prochaine équipe et faites vivre le football autour de vous.',
    'landing.join': 'Rejoindre Footera', 'landing.haveAccount': 'J’ai déjà un compte', 'landing.oneAccount': 'Un seul compte pour découvrir, participer et organiser.',
    'landing.season': 'Votre saison commence ici', 'landing.playTogether': 'Le jeu se joue ensemble.', 'landing.community': 'Joueurs, clubs et passion',
    'landing.tools': 'Des outils simples pour les joueurs, les clubs et tous ceux qui font avancer le football.',
    'landing.sectionTitle': 'Une plateforme pensée pour le terrain', 'landing.sectionDescription': 'Retrouvez au même endroit les essentiels de votre quotidien footballistique.',
    'landing.featurePlayers': 'Joueurs et équipes', 'landing.featurePlayersDescription': 'Découvrez les profils, les effectifs et les opportunités de recrutement.',
    'landing.featureMatches': 'Matchs et tournois', 'landing.featureMatchesDescription': 'Suivez les compétitions, les résultats et les statistiques.',
    'landing.featurePitches': 'Terrains', 'landing.featurePitchesDescription': 'Trouvez un terrain, consultez ses disponibilités et réservez vos créneaux.',
    'landing.footer': 'Footera — Faites grandir le football, ensemble.',
  },
  en: {
    'language.label': 'Language',
    'language.malagasy': 'Malagasy',
    'language.english': 'English',
    'language.french': 'French',
    'common.loading': 'Loading…',
    'common.loadingSession': 'Loading your session…',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.search': 'Search',
    'nav.open': 'Open navigation menu',
    'nav.searchPlaceholder': 'Search for a player or a team…',
    'nav.stats': 'Stats & Top scorers',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Go to my profile',
    'nav.logout': 'Log out',
    'auth.logoutTitle': 'Confirm logout',
    'auth.logoutSubtitle': 'You can log back in at any time.',
    'auth.logoutPrompt': 'Are you sure you want to log out of your account?',
    'auth.logoutConfirm': 'Yes, log me out',
    'auth.logoutError': 'Logout failed.',
    'auth.login': 'Log in',
    'auth.register': 'Create an account',
    'auth.brandSubtitle': 'Your football hub',
    'auth.welcomeBack': 'Welcome back',
    'auth.joinCommunity': 'Join the Footera community.',
    'auth.signInPrompt': 'Log in to access your account.',
    'auth.name': 'Full name',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.passwordMinimum': 'At least 12 characters.',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.wait': 'Please wait…',
    'auth.createAccount': 'Create my account',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': 'Don’t have an account yet?',
    'auth.genericError': 'Unable to sign you in.',
    'landing.loading': 'Loading…',
    'nav.home': 'Home', 'nav.players': 'Players', 'nav.matches': 'Matches', 'nav.mobile': 'Mobile navigation',
    'nav.profileShort': 'Profile', 'nav.teamsMatches': 'Matches & competitions', 'nav.tournaments': 'Tournaments',
    'nav.pitches': 'Pitches', 'nav.marketplace': 'Marketplace', 'nav.recruitment': 'Transfers',
    'nav.closeMenu': 'Close menu', 'nav.sidebar': 'Footera side menu',
    'notifications.title': 'Notifications', 'notifications.markAll': 'Mark all as read',
    'notifications.readAll': 'Read all', 'notifications.close': 'Close panel', 'notifications.empty': 'No notifications yet.',
    'common.closeNotification': 'Close notification', 'common.closeDialog': 'Close dialog',
    'upload.imageError': 'Image upload failed.', 'upload.inProgress': 'Uploading…',
    'upload.photoInProgress': 'Uploading photo', 'upload.formats': 'PNG, JPEG or WebP · 5 MB max',
    'demo.mode': 'Mode', 'demo.banner': 'Live and interactive football data',
    'demo.resetTitle': 'Synchronize demo data from the backend', 'demo.reset': 'Sync demo data',
    'market.title': 'Football marketplace', 'market.subtitle': 'Buy and sell boots, collector shirts, balls and match equipment.',
    'market.sell': 'Sell equipment', 'market.search': 'Search by model, brand or city…', 'market.filter': 'Filter by equipment category',
    'market.allCategories': 'All categories', 'market.emptyTitle': 'No equipment for sale', 'market.emptyDescription': 'Be the first to post an ad in this category!',
    'market.sellerVerified': 'Verified seller', 'market.contact': 'Contact the seller to arrange a handover', 'market.createSubtitle': 'List your item on the community marketplace',
    'market.itemTitle': 'Item title *', 'market.itemExample': 'E.g. boots, size 43', 'market.category': 'Category *', 'market.chooseCategory': 'Choose a category',
    'market.price': 'Sale price (€) *', 'market.condition': 'Item condition *', 'market.chooseCondition': 'Choose a condition', 'market.city': 'Pickup city *',
    'market.cityExample': 'E.g. Antananarivo', 'market.brand': 'Brand *', 'market.chooseBrand': 'Choose a brand', 'market.description': 'Item description and details',
    'market.descriptionHint': 'Add the size, color and usage history…', 'market.photo': 'Item photo *', 'market.importPhoto': 'Upload a photo',
    'market.sellerRoleRequired': 'The Seller role is required to upload an image.', 'market.cancel': 'Cancel', 'market.publishing': 'Publishing…', 'market.publish': 'Publish my listing',
    'market.required': 'Complete all required fields and choose a photo.', 'market.invalidPrice': 'Enter a valid price greater than 0.',
    'market.created': 'Your item was listed successfully!', 'market.createError': 'Unable to list this item', 'market.contactSent': 'Message sent to {seller}!',
    'landing.brand': 'Footera — home', 'landing.login': 'Log in', 'landing.connectedFootball': 'Football, connected',
    'landing.titleLead': 'All local football,', 'landing.titleAccent': 'in one place.',
    'landing.description': 'Footera brings players, clubs, matches, tournaments and pitches together on one platform. Organize your season, find your next team and bring football to life around you.',
    'landing.join': 'Join Footera', 'landing.haveAccount': 'I already have an account', 'landing.oneAccount': 'One account to discover, participate and organize.',
    'landing.season': 'Your season starts here', 'landing.playTogether': 'The game is better together.', 'landing.community': 'Players, clubs and passion',
    'landing.tools': 'Simple tools for players, clubs and everyone moving football forward.',
    'landing.sectionTitle': 'A platform built for the pitch', 'landing.sectionDescription': 'Find everything you need for football life in one place.',
    'landing.featurePlayers': 'Players and teams', 'landing.featurePlayersDescription': 'Discover player profiles, squads and recruitment opportunities.',
    'landing.featureMatches': 'Matches and tournaments', 'landing.featureMatchesDescription': 'Follow competitions, results and statistics.',
    'landing.featurePitches': 'Pitches', 'landing.featurePitchesDescription': 'Find a pitch, check availability and book a time slot.',
    'landing.footer': 'Footera — Growing football together.',
  },
  mg: {
    'language.label': 'Fiteny',
    'language.malagasy': 'Malagasy',
    'language.english': 'Anglisy',
    'language.french': 'Frantsay',
    'common.loading': 'Eo am-pakana…',
    'common.loadingSession': 'Eo am-pakana ny fidiranao…',
    'common.close': 'Hidio',
    'common.cancel': 'Aoka ihany',
    'common.save': 'Tehirizo',
    'common.search': 'Karohy',
    'nav.open': 'Sokafy ny sakafo fitetezana',
    'nav.searchPlaceholder': 'Mitadiava mpilalao na ekipa…',
    'nav.stats': 'Antontan’isa sy mpamono baolina',
    'nav.notifications': 'Fampandrenesana',
    'nav.profile': 'Mankanesa amin’ny mombamomba ahy',
    'nav.logout': 'Hivoaka',
    'auth.logoutTitle': 'Hamafiso ny fivoahana',
    'auth.logoutSubtitle': 'Afaka miditra indray ianao amin’ny fotoana rehetra.',
    'auth.logoutPrompt': 'Tena te hivoaka amin’ny kaontinao ve ianao?',
    'auth.logoutConfirm': 'Eny, hivoaka aho',
    'auth.logoutError': 'Tsy nahomby ny fivoahana.',
    'auth.login': 'Hiditra',
    'auth.register': 'Hamorona kaonty',
    'auth.brandSubtitle': 'Toerana natokana ho an’ny baolina kitra',
    'auth.welcomeBack': 'Tonga soa indray',
    'auth.joinCommunity': 'Midira ao amin’ny vondrom-piarahamonina Footera.',
    'auth.signInPrompt': 'Midira raha hijery ny kaontinao.',
    'auth.name': 'Anarana feno',
    'auth.email': 'Adiresy mailaka',
    'auth.password': 'Teny miafina',
    'auth.passwordMinimum': 'Tarehintsoratra 12 farafahakeliny.',
    'auth.showPassword': 'Asehoy ny teny miafina',
    'auth.hidePassword': 'Afeno ny teny miafina',
    'auth.wait': 'Miandrasa kely…',
    'auth.createAccount': 'Hamorona ny kaontiko',
    'auth.haveAccount': 'Efa manana kaonty ve ianao?',
    'auth.noAccount': 'Mbola tsy manana kaonty?',
    'auth.genericError': 'Tsy afaka miditra ianao izao.',
    'landing.loading': 'Eo am-pakana…',
    'nav.home': 'Fandraisana', 'nav.players': 'Mpilalao', 'nav.matches': 'Lalao', 'nav.mobile': 'Fitetezana amin’ny finday',
    'nav.profileShort': 'Mombamomba', 'nav.teamsMatches': 'Lalao sy fifaninanana', 'nav.tournaments': 'Fifaninanana',
    'nav.pitches': 'Kianja', 'nav.marketplace': 'Tsena', 'nav.recruitment': 'Fifindrana',
    'nav.closeMenu': 'Hidio ny sakafo', 'nav.sidebar': 'Sakafo fitetezana an-tsisin’ny Footera',
    'notifications.title': 'Fampandrenesana', 'notifications.markAll': 'Ataovy voavaky daholo',
    'notifications.readAll': 'Vakio daholo', 'notifications.close': 'Hidio ny takelaka', 'notifications.empty': 'Tsy mbola misy fampandrenesana.',
    'common.closeNotification': 'Hidio ny fampandrenesana', 'common.closeDialog': 'Hidio ny varavarankely',
    'upload.imageError': 'Tsy nahomby ny fampidirana sary.', 'upload.inProgress': 'Eo am-pandefasana…',
    'upload.photoInProgress': 'Eo am-pandefasana ny sary', 'upload.formats': 'PNG, JPEG na WebP · 5 Mo farafahabetsany',
    'demo.mode': 'Fomba', 'demo.banner': 'Angona baolina kitra miasa sy azo ifandraisana',
    'demo.resetTitle': 'Ampifanaraho amin’ny angona ao amin’ny backend ny demo', 'demo.reset': 'Ampifanaraho ny demo',
    'market.title': 'Tsena baolina kitra', 'market.subtitle': 'Mividiana sy amidio kiraro, akanjo, baolina ary fitaovana filalaovana.',
    'market.sell': 'Hivarotra fitaovana', 'market.search': 'Karohy araka ny modely, marika na tanàna…', 'market.filter': 'Sivano araka ny sokajin’entana',
    'market.allCategories': 'Sokajy rehetra', 'market.emptyTitle': 'Tsy misy fitaovana amidy', 'market.emptyDescription': 'Aoka ianao no voalohany hametraka filazana amin’ity sokajy ity!',
    'market.sellerVerified': 'Mpivarotra voamarina', 'market.contact': 'Mifandraisa amin’ny mpivarotra mba handaminana ny fifanomezana', 'market.createSubtitle': 'Apetraho ao amin’ny tsenan’ny vondrom-piarahamonina ny entanao',
    'market.itemTitle': 'Lohatenin’ny entana *', 'market.itemExample': 'Ohatra: kiraro habe 43', 'market.category': 'Sokajy *', 'market.chooseCategory': 'Misafidiana sokajy',
    'market.price': 'Vidiny (€) *', 'market.condition': 'Toetry ny entana *', 'market.chooseCondition': 'Misafidiana toe-javatra', 'market.city': 'Tanàna hakana azy *',
    'market.cityExample': 'Ohatra: Antananarivo', 'market.brand': 'Marika *', 'market.chooseBrand': 'Misafidiana marika', 'market.description': 'Mombamomba ny entana',
    'market.descriptionHint': 'Lazao ny habe, loko ary ny tantaran’ny fampiasana…', 'market.photo': 'Sarin’ny entana *', 'market.importPhoto': 'Hampiditra sary',
    'market.sellerRoleRequired': 'Ilaina ny andraikitry ny Mpivarotra raha hampiditra sary.', 'market.cancel': 'Aoka ihany', 'market.publishing': 'Eo am-pamoahana…', 'market.publish': 'Avoahy ny filazako',
    'market.required': 'Fenoy ny saha rehetra tsy maintsy fenoina ary mifidiana sary.', 'market.invalidPrice': 'Ampidiro ny vidiny marina mihoatra ny 0.',
    'market.created': 'Voapetraka soa aman-tsara ny entanao!', 'market.createError': 'Tsy afaka nametraka ilay entana', 'market.contactSent': 'Nalefa tamin’i {seller} ny hafatra!',
    'landing.brand': 'Footera — fandraisana', 'landing.login': 'Hiditra', 'landing.connectedFootball': 'Baolina kitra mifandray',
    'landing.titleLead': 'Ny baolina kitra eto an-toerana,', 'landing.titleAccent': 'amin’ny toerana iray.',
    'landing.description': 'Ampiraisin’ny Footera amin’ny sehatra iray ny mpilalao, klioba, lalao, fifaninanana ary kianja. Alamino ny vanim-potoananao, tadiavo ny ekipa manaraka ary velomy ny baolina kitra manodidina anao.',
    'landing.join': 'Hiara-dia amin’ny Footera', 'landing.haveAccount': 'Efa manana kaonty aho', 'landing.oneAccount': 'Kaonty iray hahitana, handraisana anjara ary handaminana.',
    'landing.season': 'Eto no manomboka ny vanim-potoananao', 'landing.playTogether': 'Miara-milalao isika.', 'landing.community': 'Mpilalao, klioba ary fitiavana',
    'landing.tools': 'Fitaovana tsotra ho an’ny mpilalao, klioba ary izay rehetra mampandroso ny baolina kitra.',
    'landing.sectionTitle': 'Sehatra natao ho an’ny kianja', 'landing.sectionDescription': 'Eto amin’ny toerana iray ny zavatra ilaina amin’ny fiainana ara-baolina kitra.',
    'landing.featurePlayers': 'Mpilalao sy ekipa', 'landing.featurePlayersDescription': 'Jereo ny mombamomba, ny lisitry ny ekipa ary ny asa fitadiavana mpilalao.',
    'landing.featureMatches': 'Lalao sy fifaninanana', 'landing.featureMatchesDescription': 'Araho ny fifaninanana, vokatra ary antontan’isa.',
    'landing.featurePitches': 'Kianja', 'landing.featurePitchesDescription': 'Mitadiava kianja, jereo ny fotoana malalaka ary mamandriha fotoana.',
    'landing.footer': 'Footera — Ampitomboy miaraka ny baolina kitra.',
  },
} as const;

type MessageKey = keyof typeof messages.fr;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: MessageKey, values?: Record<string, string | number>) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === 'mg' || value === 'en' || value === 'fr';
}

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem('footera.language');
      return isLanguage(saved) ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem('footera.language', nextLanguage);
    } catch {
      // Language selection still applies for this session when storage is unavailable.
    }
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => {
      const message: string = messages[language][key] ?? messages.fr[key];
      return Object.entries(values ?? {}).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), message);
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider.');
  return context;
}

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
      <span>{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="min-h-10 rounded-xl border border-pitch-line bg-white px-2 text-pitch-ink"
      >
        <option value="mg">{t('language.malagasy')}</option>
        <option value="en">{t('language.english')}</option>
        <option value="fr">{t('language.french')}</option>
      </select>
    </label>
  );
};

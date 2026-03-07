# PURPLE SPELLS 🟣

![](./_images/purple-spells.png)

Une cheatsheet offensif et interactif — fichier HTML **unique et portable**, conçu pour les pentesters et les passionnés de CTF.

> Pas d'installation, pas de dépendances. Un seul fichier, ouvre-le dans un navigateur et c'est parti.

___

## Aperçu

**Purple Spells** est un outil tout-en-un pour la sécurité offensive. Il regroupe commandes, techniques et générateurs dans une interface web, organisée par onglets, avec des variables dynamiques qui s'injectent automatiquement dans toutes les commandes.

___

## Fonctionnalités

### 🎯 Barre de variables dynamiques
Renseigne une fois tes variables cibles en haut de l'interface (IP, URL, DOMAIN, USER, PASS, NTLM, LHOST, LPORT, WORDLIST, DIRLIST) — elles se substituent automatiquement dans **toutes** les commandes du cheatsheet.

### 🔐 Creds Vault
Panneau latéral dédié au stockage des credentials récoltés (source, user, domain, pass, NTLM hash, note). Le bouton **USE** injecte directement les creds dans la barre de variables. Export CSV disponible.

### ⭐ Favoris
Chaque section et sous-section peut être mise en favori (★). L'onglet **FAVORITES** liste tous tes favoris pour un accès instantané. Persisté en localStorage.

### 📝 Notes
Panneau de prise de notes persistant (bouton **NOTES**), sauvegardé en localStorage.

### 🔍 Recherche
Recherche en temps réel dans toutes les sections. `Escape` efface la recherche et restaure l'état replié.

### 🧰 Array Tools
Tableau récapitulatif de tous les outils référencés dans le cheatsheet avec leurs liens GitHub directs (RustScan, LinPEAS, WinPEAS, BloodHound, Mimikatz, Impacket, Chisel, Ligolo-ng, Hydra, Hashcat, NetExec, Evil-WinRM, Responder, et d'autres). Accessible via le bouton **ARRAY TOOLS**.

### 🎨 Thème & zoom
- Thème **dark / light** (bouton THEME), persisté
- Ajustement de la taille de police **− / +** (12–20px), persisté

### 🛠️ Générateurs de commandes intégrés
- **Hydra** — brute-force avec sélection de protocole, credentials, form data
- **MSFvenom** — génération de payload (type, format, LHOST, LPORT, fichier de sortie)
- **Hashcat** — crack de hash (mode, fichier, wordlist, règles, --force)

---

## Onglets

| Onglet | Contenu |
|---|---|
| **ENUMERATION** | Nmap, RustScan, Password Spraying |
| **WEB** | Dir Enum, SQLi, XSS, LFI/RFI, File Upload, Command Injection |
| **PROTOCOLS** | SMB, DNS, FTP, SNMP, SMTP, MSSQL, MySQL, SSH, RDP, WinRM, NFS, POP3, PostgreSQL, Rsync, SQLite |
| **WIN PRIVESC** | Initial Enum, Privileges (SeImpersonate, SeDebug, SeBackup, SeRestore…), Services, Registry, etc. |
| **LIN PRIVESC** | SUID, Sudo, Cron, Capabilities, etc. |
| **AD ATTACKS** | Kerberoasting, AS-REP, Pass-the-Hash/Ticket, BloodHound, DCSync, Lateral Movement (nxc, PsExec, WMI, DCOM, RDP…) |
| **NETWORKING** | Ping/Port sweep, Tunneling (SSH, Ligolo, Chisel, dnscat2) |
| **TOOLS** | RevShells (iframe), générateurs Hydra / MSFvenom / Hashcat |
| **MISC** | Divers |
| **★ FAVORITES** | Toutes tes sections favorites |

---

## Utilisation

```bash
# Cloner le repo
git clone https://github.com/<ton-user>/purple-spells.git

# Ouvrir le fichier dans ton navigateur
xdg-open Purple-Spells.html
# ou
firefox Purple-Spells.html
# ou
google-chrome Purple-Spells.html
```

> Fonctionne entièrement en local — aucune connexion requise (sauf l'iframe RevShells et les polices Google Fonts).

---

## Auteur

Projet développé par **Quirky**

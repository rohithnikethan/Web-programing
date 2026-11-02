# PawHaven: Pet Adoption Shelter Management System

PawHaven helps a small animal shelter keep track of the animals in its care, the people who want to adopt, and the adoption applications between them. It runs entirely in the browser and is built with plain **HTML, CSS and JavaScript**, with no frameworks and no server.

## Run it

Open `index.html` in any modern browser. Data is saved in the browser's `localStorage`, so it is still there when you reopen the page. The app starts with a small demo shelter. **Reset demo** restores it at any time.

## Features

| Area | What you can do |
| --- | --- |
| **Dashboard** | See shelter totals, the adoption rate, a species chart and a recent-activity feed |
| **Animals** | Add, edit and remove animals. Search by name or breed, filter by species or status, and sort |
| **Adopters** | Register, edit and remove adopters. Search by name or email |
| **Applications** | Submit an adoption application, then approve or reject it. Filter by status |
| **Data** | Export everything as a JSON file, or reset to the demo data |

## Business rules

The system enforces rules so the records stay consistent:

- An animal's status (**Available**, **Pending**, **Adopted**) can't be edited by hand. It always follows its applications.
- Only **Available** animals can receive an application. Submitting one makes the animal **Pending**.
- **Approving** an application marks the animal **Adopted**. **Rejecting** it makes the animal **Available** again.
- An animal or adopter that has any application on record can't be deleted. This keeps the history intact.
- Form validation checks required fields, the age range, the phone format, the email format and that no two adopters share an email.

## Project structure

```
index.html   page shell, navigation and the two shared dialogs
style.css    responsive layout, light and dark themes
script.js    data store, business rules, forms, views and routing
```

How `script.js` is organized:

- **Store.** A single `db` object with `animals`, `adopters`, `applications` and `log`, saved to `localStorage` after every change.
- **Rules.** Functions such as `createApplication` and `decideApplication` change the data and keep statuses consistent.
- **Forms.** One reusable `openForm()` dialog builds every form from a list of field definitions and handles validation.
- **Views.** The dashboard, animals, adopters and applications views are built with a small `h()` helper that creates DOM elements. User text is always inserted as text, never as HTML, so it can't inject markup.
- **Routing.** The URL hash (`#animals`, `#adopters`, …) selects the view.

## Accessibility

Labeled form fields with inline error messages, keyboard-operable dialogs, a skip link, visible focus outlines, `aria-label`s that name the record on every action button, and a layout that adapts to phones and to dark mode.

## Ideas for next steps

- Photo upload for each animal
- Vaccination and medical history per animal
- A real back end and database (for example Node.js with SQLite)
- Staff login

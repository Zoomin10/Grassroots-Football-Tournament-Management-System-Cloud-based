### context.md
### Project

Wroughton Youth FC – Tournament Management System (Cloud-based)

Purpose of This Context

This document captures the current, correct state of the project so a new ChatGPT thread can be started without historical baggage.

High-level Overview

A React + Node.js + PostgreSQL web application for managing grassroots football tournaments, with distinct views for:

        Admin Control Panel (/admin)

        Public Registration (/register)

        Public Matchday View (/public)

        TV / Large Screen View (/tv)

The system is designed for matchday reliability, simple workflows, and spectator-friendly displays.

Core Concepts
Tournaments

Each tournament includes:

        Year
        Gender
        Age group
        Date, kickoff time
        Match length
        Venue
        Pitch allocation per league

Visibility Flags (Important)

Each tournament has two boolean flags:

        registration_open : Controls whether the tournament appears on the Registration page

        published : Controls whether the tournament appears on Public View and TV View

These flags are toggled from the Admin Control Panel.

Registration Model (Key Design)

Public Registrations

        Stored in registrations
        Do not immediately create a team
        Generate a unique Team ID for follow-up edits

Admin Approval

        Admin approves a registration
        System creates a row in teams

registrations.team_row_id links registration → team

This prevents duplicate teams and preserves registration history.

Database (Authoritative Summary)
Core Tables

        tournaments
        leagues
        teams
        matches

Registration Tables

        registrations
        registration_players

Important Notes

        teams does not store league stats
        League tables are computed dynamically from matches
        teams.league_id and teams.tournament_id are NOT NULL

Print Mode

Admin can open a print-ready public view: /public?tournamentId=<id>&print=true

        Public view auto-triggers browser print once
        print=true is removed from the URL after triggering
        Refreshing does not re-print

Deployment

        Hosted on Railway
        PostgreSQL managed by Railway
        All destructive DB actions guarded by confirmation flags

Current Status

        Admin toggles implemented for Registration + Publish
        Public & TV views only show published tournaments
        Registration page only shows registration_open tournaments
        Print flow works via Admin → Public View

--
-- PostgreSQL database dump
--

\restrict Song1VVFWQgkw3qof8b7xiAsfShZ9Zf3o5VQ6QLabdS8nmmE5J07rpzziAKdYXL

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: leagues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leagues (
    id integer NOT NULL,
    name text NOT NULL,
    tournament_id integer NOT NULL
);


--
-- Name: leagues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leagues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leagues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leagues_id_seq OWNED BY public.leagues.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    league_id integer,
    home_team_id integer NOT NULL,
    away_team_id integer NOT NULL,
    round text DEFAULT 'league'::text NOT NULL,
    bracket text,
    home_score integer,
    away_score integer,
    played boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    team text NOT NULL,
    league_id integer NOT NULL,
    tournament_id integer NOT NULL
);


--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournaments (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    year integer NOT NULL,
    gender text NOT NULL,
    age_group text NOT NULL,
    date date,
    kickoff_time time without time zone,
    match_length integer,
    venue text,
    pitch_league_a text,
    pitch_league_b text
);


--
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- Name: leagues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leagues ALTER COLUMN id SET DEFAULT nextval('public.leagues_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- Data for Name: leagues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leagues (id, name, tournament_id) FROM stdin;
5	League A	3
6	League B	3
9	League A	5
10	League B	5
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, tournament_id, league_id, home_team_id, away_team_id, round, bracket, home_score, away_score, played, created_at, updated_at) FROM stdin;
54	5	9	31	33	league	\N	1	2	t	2026-01-08 17:41:59.295664+00	2026-01-08 17:42:14.949563+00
55	5	9	31	35	league	\N	2	0	t	2026-01-08 17:41:59.314513+00	2026-01-08 17:42:22.16005+00
56	5	9	31	38	league	\N	2	1	t	2026-01-08 17:41:59.326737+00	2026-01-08 17:42:27.967258+00
57	5	9	33	35	league	\N	1	0	t	2026-01-08 17:41:59.348264+00	2026-01-08 17:44:10.512112+00
58	5	9	33	38	league	\N	1	1	t	2026-01-08 17:41:59.36806+00	2026-01-08 17:44:24.368409+00
59	5	9	35	38	league	\N	0	2	t	2026-01-08 17:41:59.377288+00	2026-01-08 17:44:31.124544+00
61	5	10	32	36	league	\N	\N	\N	f	2026-01-08 17:47:04.683692+00	2026-01-08 17:47:04.683692+00
62	5	10	32	37	league	\N	\N	\N	f	2026-01-08 17:47:04.68769+00	2026-01-08 17:47:04.68769+00
63	5	10	34	36	league	\N	\N	\N	f	2026-01-08 17:47:04.691463+00	2026-01-08 17:47:04.691463+00
64	5	10	34	37	league	\N	\N	\N	f	2026-01-08 17:47:04.697681+00	2026-01-08 17:47:04.697681+00
65	5	10	36	37	league	\N	\N	\N	f	2026-01-08 17:47:04.701237+00	2026-01-08 17:47:04.701237+00
60	5	10	32	34	league	\N	1	0	t	2026-01-08 17:47:04.67797+00	2026-01-08 17:47:12.516087+00
67	5	\N	32	33	semi-final	cup	\N	\N	f	2026-01-08 19:02:11.890272+00	2026-01-08 19:02:11.890272+00
68	5	\N	35	37	semi-final	plate	\N	\N	f	2026-01-08 19:02:11.899854+00	2026-01-08 19:02:11.899854+00
69	5	\N	36	38	semi-final	plate	\N	\N	f	2026-01-08 19:02:11.907402+00	2026-01-08 19:02:11.907402+00
66	5	\N	31	34	semi-final	cup	1	0	t	2026-01-08 19:02:11.883874+00	2026-01-08 19:02:30.64681+00
28	3	5	21	22	league	\N	2	1	t	2026-01-08 17:04:54.688842+00	2026-01-08 17:05:06.577935+00
29	3	5	21	23	league	\N	3	0	t	2026-01-08 17:04:54.693224+00	2026-01-08 17:05:14.086133+00
30	3	5	21	24	league	\N	1	2	t	2026-01-08 17:04:54.699542+00	2026-01-08 17:05:21.555573+00
31	3	5	21	26	league	\N	1	0	t	2026-01-08 17:04:54.703114+00	2026-01-08 17:05:29.644529+00
32	3	5	22	23	league	\N	1	3	t	2026-01-08 17:04:54.707245+00	2026-01-08 17:05:43.141224+00
33	3	5	22	24	league	\N	3	4	t	2026-01-08 17:04:54.711493+00	2026-01-08 17:05:55.40438+00
34	3	5	22	26	league	\N	1	1	t	2026-01-08 17:04:54.715376+00	2026-01-08 17:06:03.714907+00
35	3	5	23	24	league	\N	1	5	t	2026-01-08 17:04:54.726199+00	2026-01-08 17:06:10.125018+00
36	3	5	23	26	league	\N	1	3	t	2026-01-08 17:04:54.735089+00	2026-01-08 17:06:20.739621+00
37	3	5	24	26	league	\N	2	2	t	2026-01-08 17:04:54.739567+00	2026-01-08 17:06:30.667617+00
38	3	6	25	27	league	\N	1	2	t	2026-01-08 17:06:45.651807+00	2026-01-08 17:06:52.624242+00
39	3	6	25	28	league	\N	3	3	t	2026-01-08 17:06:45.682632+00	2026-01-08 17:07:00.957527+00
40	3	6	25	29	league	\N	1	6	t	2026-01-08 17:06:45.688218+00	2026-01-08 17:07:08.048886+00
41	3	6	25	30	league	\N	1	1	t	2026-01-08 17:06:45.696576+00	2026-01-08 17:07:13.894352+00
42	3	6	27	28	league	\N	2	0	t	2026-01-08 17:06:45.703414+00	2026-01-08 17:07:20.483061+00
43	3	6	27	29	league	\N	1	0	t	2026-01-08 17:06:45.711949+00	2026-01-08 17:07:27.376632+00
44	3	6	27	30	league	\N	3	0	t	2026-01-08 17:06:45.720888+00	2026-01-08 17:07:34.11502+00
45	3	6	28	29	league	\N	2	5	t	2026-01-08 17:06:45.726336+00	2026-01-08 17:07:45.119923+00
46	3	6	28	30	league	\N	5	0	t	2026-01-08 17:06:45.738574+00	2026-01-08 17:07:53.784434+00
47	3	6	29	30	league	\N	3	0	t	2026-01-08 17:06:45.749239+00	2026-01-08 17:08:01.167401+00
48	3	\N	21	27	semi-final	cup	1	0	t	2026-01-08 17:08:06.56169+00	2026-01-08 17:08:19.339898+00
49	3	\N	25	22	semi-final	cup	0	3	t	2026-01-08 17:08:06.573206+00	2026-01-08 17:08:30.004162+00
52	3	\N	21	22	final	cup	2	0	t	2026-01-08 17:08:30.147083+00	2026-01-08 17:08:37.833076+00
50	3	\N	23	29	semi-final	plate	3	1	t	2026-01-08 17:08:06.58316+00	2026-01-08 17:08:46.073788+00
51	3	\N	28	24	semi-final	plate	3	4	t	2026-01-08 17:08:06.589767+00	2026-01-08 17:08:52.435035+00
53	3	\N	23	24	final	plate	1	5	t	2026-01-08 17:08:52.588878+00	2026-01-08 17:08:58.743693+00
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, team, league_id, tournament_id) FROM stdin;
21	Wroughton Youth FC	5	3
22	Bishops Cannings	5	3
23	Croft FC	5	3
24	Malmsbury	5	3
25	Wootten Bassett	6	3
26	Derry HillFC	5	3
27	Stratton juniors	6	3
28	Abbey Meads	6	3
29	Chippenham FC	6	3
30	Swindon sparks	6	3
31	Wroughton Youth FC	9	5
32	Stratton Juniors	10	5
33	Chippenham FC	9	5
34	Abbey Meads	10	5
35	Develop FC	9	5
36	Derry Hill FC	10	5
37	Bishops Cannings	10	5
38	Malmsbury	9	5
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tournaments (id, created_at, year, gender, age_group, date, kickoff_time, match_length, venue, pitch_league_a, pitch_league_b) FROM stdin;
3	2026-01-08 16:55:01.98376+00	2026	boys	U11	2026-07-18	09:00:00	10	Wichelstowe Sports Hub	Pitch 1	Pitch 3
5	2026-01-08 17:38:14.72552+00	2026	Girls	U12	2026-07-19	10:00:00	10	Wichelstowe Sports Hub	Pitch 2	Pitch 4
\.


--
-- Name: leagues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leagues_id_seq', 10, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.matches_id_seq', 69, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teams_id_seq', 38, true);


--
-- Name: tournaments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tournaments_id_seq', 5, true);


--
-- Name: leagues leagues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: idx_leagues_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leagues_tournament_id ON public.leagues USING btree (tournament_id);


--
-- Name: idx_matches_bracket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_bracket ON public.matches USING btree (bracket);


--
-- Name: idx_matches_league_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_league_id ON public.matches USING btree (league_id);


--
-- Name: idx_matches_round; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_round ON public.matches USING btree (round);


--
-- Name: idx_matches_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_tournament_id ON public.matches USING btree (tournament_id);


--
-- Name: idx_teams_league_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_league_id ON public.teams USING btree (league_id);


--
-- Name: idx_teams_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_tournament_id ON public.teams USING btree (tournament_id);


--
-- Name: leagues leagues_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: matches matches_away_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_team_id_fkey FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: matches matches_home_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_team_id_fkey FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: matches matches_league_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_league_id_fkey FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE SET NULL;


--
-- Name: matches matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- Name: teams teams_league_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_league_id_fkey FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: teams teams_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Song1VVFWQgkw3qof8b7xiAsfShZ9Zf3o5VQ6QLabdS8nmmE5J07rpzziAKdYXL


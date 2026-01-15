--
-- PostgreSQL database dump
--


-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_league_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_team_row_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registration_players DROP CONSTRAINT IF EXISTS registration_players_registration_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_league_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_home_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_away_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.leagues DROP CONSTRAINT IF EXISTS leagues_tournament_id_fkey;
DROP TRIGGER IF EXISTS trg_registrations_set_updated_at ON public.registrations;
DROP TRIGGER IF EXISTS trg_registration_players_set_updated_at ON public.registration_players;
DROP INDEX IF EXISTS public.uniq_registrations_team_row_id;
DROP INDEX IF EXISTS public.uniq_reg_player_identity;
DROP INDEX IF EXISTS public.idx_teams_tournament_id;
DROP INDEX IF EXISTS public.idx_teams_league_id;
DROP INDEX IF EXISTS public.idx_registrations_tournament_id;
DROP INDEX IF EXISTS public.idx_registrations_manager_email;
DROP INDEX IF EXISTS public.idx_reg_players_registration_id;
DROP INDEX IF EXISTS public.idx_matches_tournament_id;
DROP INDEX IF EXISTS public.idx_matches_round;
DROP INDEX IF EXISTS public.idx_matches_league_id;
DROP INDEX IF EXISTS public.idx_matches_bracket;
DROP INDEX IF EXISTS public.idx_leagues_tournament_id;
ALTER TABLE IF EXISTS ONLY public.tournaments DROP CONSTRAINT IF EXISTS tournaments_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_team_id_code_key;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.registration_players DROP CONSTRAINT IF EXISTS registration_players_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.leagues DROP CONSTRAINT IF EXISTS leagues_pkey;
ALTER TABLE IF EXISTS public.tournaments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.teams ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registration_players ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.matches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.leagues ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.tournaments_id_seq;
DROP TABLE IF EXISTS public.tournaments;
DROP SEQUENCE IF EXISTS public.teams_id_seq;
DROP TABLE IF EXISTS public.teams;
DROP SEQUENCE IF EXISTS public.registrations_id_seq;
DROP TABLE IF EXISTS public.registrations;
DROP SEQUENCE IF EXISTS public.registration_players_id_seq;
DROP TABLE IF EXISTS public.registration_players;
DROP SEQUENCE IF EXISTS public.matches_id_seq;
DROP TABLE IF EXISTS public.matches;
DROP SEQUENCE IF EXISTS public.leagues_id_seq;
DROP TABLE IF EXISTS public.leagues;
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP TYPE IF EXISTS public.registration_status;
DROP TYPE IF EXISTS public.kit_colour;
DROP EXTENSION IF EXISTS citext;
--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: kit_colour; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kit_colour AS ENUM (
    'red',
    'black',
    'white',
    'light_blue',
    'dark_blue',
    'yellow',
    'orange',
    'green',
    'purple',
    'grey',
    'navy',
    'maroon',
    'pink',
    'brown',
    'gold'
);


--
-- Name: registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.registration_status AS ENUM (
    'pending',
    'submitted',
    'locked',
    'cancelled'
);


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


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
    decided_by_penalties boolean DEFAULT false NOT NULL,
    penalties_home integer,
    penalties_away integer,
    played boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT penalties_valid CHECK ((((penalties_home IS NULL) AND (penalties_away IS NULL)) OR ((penalties_home IS NOT NULL) AND (penalties_away IS NOT NULL) AND (penalties_home <> penalties_away))))
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
-- Name: registration_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registration_players (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    first_name text NOT NULL,
    surname text NOT NULL,
    dob date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: registration_players_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registration_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registration_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registration_players_id_seq OWNED BY public.registration_players.id;


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id integer NOT NULL,
    tournament_id integer NOT NULL,
    team_id_code character varying(32) NOT NULL,
    status public.registration_status DEFAULT 'pending'::public.registration_status NOT NULL,
    club_name text NOT NULL,
    team_name text NOT NULL,
    manager_name text NOT NULL,
    manager_email public.citext NOT NULL,
    manager_phone text NOT NULL,
    assistant1_name text,
    assistant2_name text,
    kit_colour_1 public.kit_colour,
    kit_colour_2 public.kit_colour,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    team_row_id integer,
    CONSTRAINT chk_different_kit_colours CHECK (((kit_colour_1 IS NULL) OR (kit_colour_2 IS NULL) OR (kit_colour_1 <> kit_colour_2)))
);


--
-- Name: registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registrations_id_seq OWNED BY public.registrations.id;


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
-- Name: registration_players id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_players ALTER COLUMN id SET DEFAULT nextval('public.registration_players_id_seq'::regclass);


--
-- Name: registrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations ALTER COLUMN id SET DEFAULT nextval('public.registrations_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


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
-- Name: registration_players registration_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_players
    ADD CONSTRAINT registration_players_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_team_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_team_id_code_key UNIQUE (team_id_code);


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
-- Name: idx_reg_players_registration_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reg_players_registration_id ON public.registration_players USING btree (registration_id);


--
-- Name: idx_registrations_manager_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_manager_email ON public.registrations USING btree (manager_email);


--
-- Name: idx_registrations_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registrations_tournament_id ON public.registrations USING btree (tournament_id);


--
-- Name: idx_teams_league_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_league_id ON public.teams USING btree (league_id);


--
-- Name: idx_teams_tournament_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_tournament_id ON public.teams USING btree (tournament_id);


--
-- Name: uniq_reg_player_identity; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_reg_player_identity ON public.registration_players USING btree (registration_id, first_name, surname, dob);


--
-- Name: uniq_registrations_team_row_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_registrations_team_row_id ON public.registrations USING btree (team_row_id) WHERE (team_row_id IS NOT NULL);


--
-- Name: registration_players trg_registration_players_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registration_players_set_updated_at BEFORE UPDATE ON public.registration_players FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: registrations trg_registrations_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registrations_set_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


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
-- Name: registration_players registration_players_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_players
    ADD CONSTRAINT registration_players_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registrations(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_team_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_team_row_id_fkey FOREIGN KEY (team_row_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: registrations registrations_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;


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



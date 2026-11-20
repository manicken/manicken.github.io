// Path checks for the project API (specs/asdt-backend.md, section 5).
//
// Every path that comes from a request goes through here. A path is relative to the projects folder, uses "/" as
// separator, and must stay inside the projects folder also after symlinks and junctions are resolved. Based on
// WebScope's resolveVirtualPath, plus: the base is resolved once at startup, every new folder level is checked when
// folders are made, and the Windows traps (":", device names, trailing dots/spaces) are refused.
"use strict";
const fs = require("fs");
const path = require("path");

/** an Error with an HTTP status and an API error code */
function apiError(status, code, message) {
    return Object.assign(new Error(message), { status, code });
}

// CON, PRN, AUX, NUL, COM1-9, LPT1-9 (also with an extension: "nul.txt" is the NUL device on Windows)
const DEVICE_NAME = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;

/**
 * Checks one relative path from a request and splits it.
 * @param {String} rel  "synths/poly1" or "" (the base itself, only when allowEmpty)
 * @returns {String[]} the segments
 */
function segmentsOf(rel, allowEmpty) {
    if (typeof rel !== "string") throw apiError(400, "E_PATH", "a path must be a string");
    if (rel === "") { if (allowEmpty) return []; throw apiError(400, "E_PATH", "empty path"); }
    if (rel.length > 400) throw apiError(400, "E_PATH", "path too long");
    if (rel.startsWith("/") || /^[A-Za-z]:/.test(rel)) throw apiError(403, "E_PATH", "absolute path: " + rel);
    const segs = rel.split("/");
    for (const s of segs) {
        if (s === "" || s === "." || s === "..") throw apiError(403, "E_PATH", "bad path: " + rel);
        if (/[\\:*?"<>|\x00-\x1f]/.test(s)) throw apiError(403, "E_PATH", "bad character in path: " + rel);
        if (/[. ]$/.test(s)) throw apiError(403, "E_PATH", "a name can't end with a dot or a space: " + rel);
        if (DEVICE_NAME.test(s)) throw apiError(403, "E_PATH", "reserved name: " + rel);
    }
    return segs;
}

/** @returns {Boolean} true when p is base or inside it (both absolute, resolved) */
function isInside(base, p) {
    const r = path.relative(base, p);
    return r === "" || (!r.startsWith("..") && !path.isAbsolute(r));
}

/** realpath of the deepest part of p that exists (p itself when it exists) */
function realDeepest(p) {
    let cur = p;
    for (;;) {
        try { return { real: fs.realpathSync.native(cur), rest: path.relative(cur, p) }; }
        catch (e) {
            if (e.code !== "ENOENT" && e.code !== "ENOTDIR") throw e;
            const up = path.dirname(cur);
            if (up === cur) throw e;
            cur = up;
        }
    }
}

/**
 * The checked paths inside one base folder (the projects folder).
 * @param {String} base the projects folder; resolved with realpath here, once
 */
function createPaths(base) {
    const BASE = fs.realpathSync.native(base);

    /** throws 403 unless the real location of p (or of the part that exists) is inside BASE */
    function checkReal(p) {
        const d = realDeepest(p);
        if (!isInside(BASE, d.real)) throw apiError(403, "E_PATH", "outside the projects folder (a link?): " + path.relative(BASE, p));
    }

    /**
     * @param {String} rel a relative path from a request ("" = the base)
     * @returns {String} the absolute path, checked
     */
    function resolve(rel, allowEmpty) {
        const segs = segmentsOf(rel, allowEmpty);
        const p = path.join(BASE, ...segs);
        if (!isInside(BASE, p)) throw apiError(403, "E_PATH", "outside the projects folder: " + rel);
        checkReal(p);
        return p;
    }

    /** makes the folder p (absolute, inside BASE) one level at a time, checking every level */
    function mkdirChecked(p) {
        if (!isInside(BASE, p)) throw apiError(403, "E_PATH", "outside the projects folder");
        const rel = path.relative(BASE, p);
        let cur = BASE;
        for (const s of rel ? rel.split(path.sep) : []) {
            cur = path.join(cur, s);
            if (!fs.existsSync(cur)) fs.mkdirSync(cur);
            checkReal(cur);
            if (!fs.statSync(cur).isDirectory()) throw apiError(409, "E_EXISTS", "not a folder: " + path.relative(BASE, cur));
        }
    }

    return { BASE, resolve, checkReal, mkdirChecked, isInside: p => isInside(BASE, p) };
}

module.exports = { createPaths, segmentsOf, isInside, apiError };

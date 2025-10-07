export function assertNever(value: never, message?: string): never {
    throw new Error(message ?? `Unexpected value: ${value}`);
}

export function proveType<T>(_value: T): void {
    // This function is used for type checking only
}

export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.constructor !== b.constructor) return false;
        
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        
        for (const key of keys) {
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    
    return false;
}
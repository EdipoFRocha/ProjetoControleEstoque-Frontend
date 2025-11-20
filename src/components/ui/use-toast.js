export function useToast() {
    return {
        toast: ({ title, description, variant } = {}) => {
            if (variant === "destructive") {
                console.error(title || "Erro", description || "");
                alert(`❌ ${title || "Erro"}\n${description || ""}`);
            } else {
                console.log(title || "OK", description || "");
                if (title || description) {
                    alert(`✅ ${title || ""}\n${description || ""}`);
                }
            }
        },
    };
}

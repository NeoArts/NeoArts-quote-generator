import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { QuoteImages } from "./assets";
import type { Cell, Product } from "../types";

interface PageLayout {
    width: number;
    height: number;
    topMargin: number;
    bottomMargin: number;
    leftMargin: number;
    rightMargin: number;
    headerHeight: number;
    footerHeight: number;
    lineHeight: number;
    fontSize: number;
}

interface HeaderFooterContent {
    header?: () => void;
    footer?: () => void;
}

export class PdfProvider 
{
    private doc: jsPDF;
    private layout: PageLayout;
    private currentY: number;
    private headerFooterContent: HeaderFooterContent;
    private contentStartY: number;
    private contentEndY: number;
    private images: QuoteImages;

    // Fonts must already be registered (see assets.ts loadPdfAssets).
    constructor(images: QuoteImages, customLayout?: Partial<PageLayout>)
    {
        this.images = images;
        this.doc = this.CreateNewPdf();
        this.layout = {
            width: 602, // 8.5 inches in points
            height: 842, // 11 inches in points
            topMargin: 75, // Space for header
            bottomMargin: 90, // Space for footer
            leftMargin: 40,
            rightMargin: 40,
            headerHeight: 75,
            footerHeight: 90,
            lineHeight: 16,
            fontSize: 11,
            ...customLayout
        };
        
        this.headerFooterContent = {};
        this.contentStartY = this.layout.topMargin;
        this.contentEndY = this.layout.height - this.layout.bottomMargin;
        this.currentY = this.contentStartY;
        
        this.initializePage();
    }

    private CreateNewPdf(): jsPDF
    {
        const doc = new jsPDF("p", "pt");
        doc.setFontSize(this.layout?.fontSize || 11);
        doc.setFont("Montserrat-Regular", "normal");
        return doc;
    }

    private initializePage(): void
    {
        this.addHeaderFooter();
    }

    private addHeaderFooter(): void
    {
        if (this.headerFooterContent.header) {
            this.headerFooterContent.header();
        }
        
        if (this.headerFooterContent.footer) {
            this.headerFooterContent.footer();
        }
    }

    private checkPageBreak(requiredSpace: number): boolean
    {
        if (this.currentY + requiredSpace > this.contentEndY) {
            this.addPage();
            return true;
        }
        return false;
    }

    private addPage(): void
    {
        this.doc.addPage();
        this.currentY = this.contentStartY;
        this.addHeaderFooter();
    }

    private calculateTextHeight(text: string, maxWidth?: number): number
    {
        const lines = maxWidth ? 
            this.doc.splitTextToSize(text, maxWidth) : 
            text.split('\n');
        return Array.isArray(lines) ? lines.length * this.layout.lineHeight : this.layout.lineHeight;
    }

    private moveToNextLine(lines: number = 1): void
    {
        this.currentY += lines * this.layout.lineHeight;
    }

    // Public API methods
    SetHeaderFooter(headerFooter: HeaderFooterContent): void
    {
        this.headerFooterContent = headerFooter;
        this.addHeaderFooter();
    }

    SetDefaultHeader(): void
    {
        this.headerFooterContent.header = () => {
            this.doc.addImage(this.images.header, "PNG", 0, 0, this.layout.width, this.layout.headerHeight);
        };
        this.addHeaderFooter();
    }

    SetDefaultFooter(): void
    {
        this.headerFooterContent.footer = () => {
            this.doc.addImage(this.images.footer, "PNG", 0, this.layout.height - this.layout.footerHeight, this.layout.width, this.layout.footerHeight);
        };
        this.addHeaderFooter();
    }

    GetCurrentPosition(): { x: number, y: number }
    {
        return { x: this.layout.leftMargin, y: this.currentY };
    }

    SetPosition(y: number): void
    {
        this.currentY = Math.max(this.contentStartY, Math.min(y, this.contentEndY));
    }

    // Legacy API - maintained for backward compatibility but improved
    SetMargin(margin: number): void
    {
        this.layout.leftMargin = margin;
        this.layout.rightMargin = margin;
    }

    AddImage(image: string, format: string, x: number, y: number, width: number, height: number): void
    {
        if (width === 0)
        {
            width = this.layout.width;
        }

        // Use absolute positioning if y is provided, otherwise use current position
        const actualY = y || this.currentY;
        
        // Check if image fits on current page
        this.checkPageBreak(height);
        
        this.doc.addImage(image, format, x, actualY, width, height);
        
        // Update current position if using relative positioning
        if (!y) {
            this.currentY += height + this.layout.lineHeight; // Add some spacing after image
        }
    }

    AddSign(image: string, format: string, x: number, width: number, height: number): void
    {
        if (width === 0)
        {
            width = this.layout.width;
        }

        this.checkPageBreak(height);
        this.doc.addImage(image, format, x, this.currentY, width, height);
        this.currentY += height + this.layout.lineHeight;
    }

    SetFont(font: string): void
    {
        this.doc.setFont(font, "normal");
    }

    SetTextColor(r: number, g: number, b: number): void
    {
        this.doc.setTextColor(r, g, b);
    }

    AddHeader1(text: string, color?: string): void
    {
        const originalFontSize = this.doc.getFontSize();
        this.doc.setFontSize(24); // Largest header
        
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.doc.setFontSize(originalFontSize); // Reset font size
        this.moveToNextLine(2); // Extra spacing for large header
        this.doc.setTextColor(0, 0, 0);
    }

    AddHeader2(text: string, color?: string): void
    {
        const originalFontSize = this.doc.getFontSize();
        this.doc.setFontSize(20);
        
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.doc.setFontSize(originalFontSize);
        this.moveToNextLine(1.5); // Slightly more spacing
        this.doc.setTextColor(0, 0, 0);
    }

    AddHeader3(text: string, color?: string): void
    {
        const originalFontSize = this.doc.getFontSize();
        this.doc.setFontSize(16);
        
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.doc.setFontSize(originalFontSize);
        this.moveToNextLine(1.3);
        this.doc.setTextColor(0, 0, 0);
    }

    AddHeader4(text: string, color?: string): void
    {
        const originalFontSize = this.doc.getFontSize();
        this.doc.setFontSize(14);
        
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.doc.setFontSize(originalFontSize);
        this.moveToNextLine(1.2);
        this.doc.setTextColor(0, 0, 0);
    }

    AddHeader5(text: string, color?: string): void
    {
        const originalFontSize = this.doc.getFontSize();
        this.doc.setFontSize(12);
        
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.doc.setFontSize(originalFontSize);
        this.moveToNextLine(1.1);
        this.doc.setTextColor(0, 0, 0);
    }

    AddHeader6(text: string, color?: string): void
    {
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight);

        if(color === "white")
        {
            this.doc.setTextColor(255, 255, 255);
        } 

        this.doc.setFont("Montserrat-Bold", "normal");
        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.setFont("Montserrat-Regular", "normal");
        this.moveToNextLine();
        this.doc.setTextColor(0, 0, 0);
    }

    AddBlankLines(lines: number): void
    {
        this.moveToNextLine(lines);
    }

    AddLine(text: string): void
    {
        const textHeight = this.calculateTextHeight(text, this.layout.width - this.layout.leftMargin - this.layout.rightMargin);
        this.checkPageBreak(textHeight + this.layout.lineHeight); // Extra space buffer

        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.moveToNextLine();
    }

    AddParagraph(text: string, options?: { align?: 'left' | 'center' | 'right' | 'justify', maxWidth?: number }): void
    {
        const { align = 'left', maxWidth } = options || {};
        const availableWidth = maxWidth || (this.layout.width - this.layout.leftMargin - this.layout.rightMargin);
        
        // Split text into lines that fit within the available width
        const lines = this.doc.splitTextToSize(text, availableWidth);
        const totalHeight = lines.length * this.layout.lineHeight;
        
        // Check if the entire paragraph fits on the current page
        this.checkPageBreak(totalHeight);
        
        // Add each line with appropriate alignment
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line) {
                if (align === 'justify' && i < lines.length - 1) {
                    // Justify all lines except the last one
                    this.addJustifiedLine(line, availableWidth);
                } else if (align === 'center') {
                    const textWidth = this.doc.getTextWidth(line);
                    const x = this.layout.leftMargin + (availableWidth - textWidth) / 2;
                    this.doc.text(line, x, this.currentY);
                } else if (align === 'right') {
                    const textWidth = this.doc.getTextWidth(line);
                    const x = this.layout.leftMargin + availableWidth - textWidth;
                    this.doc.text(line, x, this.currentY);
                } else {
                    // Left align (default)
                    this.doc.text(line, this.layout.leftMargin, this.currentY);
                }
            }
            
            this.moveToNextLine();
        }
    }

    private addJustifiedLine(line: string, availableWidth: number): void
    {
        const words = line.split(' ');
        
        if (words.length <= 1) {
            // Single word or empty line, just left align
            this.doc.text(line, this.layout.leftMargin, this.currentY);
            return;
        }
        
        // Calculate the total width of all words without spaces
        const wordsWidth = words.reduce((total, word) => total + this.doc.getTextWidth(word), 0);
        
        // Calculate the total space available for gaps between words
        const totalSpaceWidth = availableWidth - wordsWidth;
        const gapCount = words.length - 1;
        const spaceWidth = totalSpaceWidth / gapCount;
        
        // Place words with calculated spacing
        let currentX = this.layout.leftMargin;
        
        for (let i = 0; i < words.length; i++) {
            this.doc.text(words[i], currentX, this.currentY);
            currentX += this.doc.getTextWidth(words[i]);
            
            // Add space between words (except after the last word)
            if (i < words.length - 1) {
                currentX += spaceWidth;
            }
        }
    }

    AddLineTab(text: string, value: string): void
    {
        const textHeight = this.calculateTextHeight(text);
        this.checkPageBreak(textHeight + this.layout.lineHeight);

        this.doc.text(text, this.layout.leftMargin, this.currentY);
        this.doc.text(value, this.layout.leftMargin + 140, this.currentY);
        this.moveToNextLine();
    }

    AddTable(headers: Cell[], data: string[][], rowHeights?: number[], products?: Product[]): void
    {
        // Calculate minimum required space for table header
        const minTableSpace = 60; // Minimum space needed for table header
        this.checkPageBreak(minTableSpace);

        const columnStyles = Array.from(headers).reduce((acc: any, cell, index) => {
            acc[index] = { cellWidth: (this.layout.width - 20) * cell.width };
            return acc;
        }, {});

        // Calculate row heights based on products if provided
        const calculatedRowHeights = this.calculateRowHeights(data, rowHeights, products);

        const startX = this.layout.leftMargin;
        const startY = this.currentY; 
    
        autoTable(this.doc, {
            head: [headers.map(header => header.text)],
            body: data,
            tableWidth: 'wrap',
            rowPageBreak: 'avoid',
            styles: { 
                fillColor: [255, 255, 255], 
                textColor: [0, 0, 0],   
                lineWidth: 0.5,             
                font: "Montserrat-Bold",
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    
                    // Apply calculated row height for each row with proper validation
                    if (calculatedRowHeights && rowIndex >= 0 && rowIndex < calculatedRowHeights.length) {
                        const calculatedHeight = calculatedRowHeights[rowIndex];
                        data.cell.styles.minCellHeight = calculatedHeight;
                    } else {
                    }
                }
            },
            willDrawCell: (data) => {
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    const remainingPageSpace = this.contentEndY - data.cell.y;
                    
                    if (remainingPageSpace < data.row.height) {
                        this.addPage();
                        data.cell.y = this.contentStartY;
                        if(data.cursor) data.cursor.y = this.contentStartY;
                    }
                    
                    // Only add image if we have valid row index and products
                    if(products && rowIndex >= 0 && rowIndex < products.length && products[rowIndex]) {
                        this.addProductImage(data.cell.y, products[rowIndex]);
                    }
                }
            },
            didDrawPage: (data) => {
                // Update current position after table is drawn
                this.currentY = data.cursor?.y || this.currentY;
            },
            headStyles: { 
                fillColor: [211, 211, 211], 
                textColor: [112, 112, 112],
                lineWidth: 0.5,             
                font: "Montserrat-Bold"   
            },
            columnStyles: columnStyles,
            startY: startY,
            margin: { left: startX, right: this.layout.rightMargin },
        });
    }

    private calculateRowHeights(data: string[][], providedRowHeights?: number[], products?: Product[]): number[]
    {
        const DEFAULT_ROW_HEIGHT = 30; // Default minimum row height
        const CELL_PADDING = 10; // Padding around images
        const MIN_IMAGE_MARGIN = 5; // Minimum margin around images
        
        const rowHeights: number[] = [];
        
        
        for (let i = 0; i < data.length; i++) {
            let calculatedHeight = DEFAULT_ROW_HEIGHT;
            
            // Use provided row height if available
            if (providedRowHeights && i < providedRowHeights.length && providedRowHeights[i] > 0) {
                calculatedHeight = providedRowHeights[i];
            }
            
            // Calculate height based on product image if available
            if (products && i < products.length) {
                const product = products[i];
                
                const imageHeight = this.getProductImageHeight(product);
                
                if (imageHeight > 0) {
                    // Add padding around the image for better presentation
                    const requiredHeight = imageHeight + (CELL_PADDING * 2) + MIN_IMAGE_MARGIN;
                    calculatedHeight = Math.max(calculatedHeight, requiredHeight);
                    
                } else {
                }
            } else {
            }
            
            rowHeights.push(calculatedHeight);
        }
        
        return rowHeights;
    }

    private getProductImageHeight(product: Product): number
    {
        // Validate product exists
        if (!product) {
            return 0;
        }

        // Check if product has image property
        if (!product.image) {
            return 0;
        }

        // Check if image has height property and is valid
        if (!product.image.height || typeof product.image.height !== 'number' || product.image.height <= 0) {
            return 0;
        }

        // Additional validation for reasonable height values
        const MAX_REASONABLE_HEIGHT = 400; // Maximum reasonable height for table row
        const MIN_REASONABLE_HEIGHT = 10;  // Minimum reasonable height for image
        
        if (product.image.height > MAX_REASONABLE_HEIGHT) {
            console.warn(`PDF Warning: Product "${product.name || product.id || 'Unknown'}" has unusually large image height: ${product.image.height}px. Consider resizing for better layout.`);
            return MAX_REASONABLE_HEIGHT; // Cap at maximum reasonable height
        }
        
        if (product.image.height < MIN_REASONABLE_HEIGHT) {
            console.warn(`PDF Warning: Product "${product.name || product.id || 'Unknown'}" has unusually small image height: ${product.image.height}px.`);
            return MIN_REASONABLE_HEIGHT; // Use minimum reasonable height
        }

        return product.image.height;
    }

    AddTemplate(): void
    {
        this.SetDefaultHeader();
        this.SetDefaultFooter();
        
        // Apply to all existing pages
        const pageCount = this.doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.addHeaderFooter();
        }
    }

    private addProductImage(y: number, product: Product): void
    {
        // Validate product exists
        if (!product) {
            console.warn('PDF Warning: Product is undefined or null at position y:', y);
            return;
        }

        // Check if product has image property
        if (!product.image) {
            console.warn(`PDF Warning: Product "${product.name || product.id || 'Unknown'}" does not have an image property`);
            return;
        }

        // Check if image has base64String
        if (!product.image.base64String) {
            console.warn(`PDF Warning: Product "${product.name || product.id || 'Unknown'}" has an image object but no base64String`);
            return;
        }

        // Get validated image height
        const imageHeight = this.getProductImageHeight(product);
        if (imageHeight <= 0) {
            console.warn(`PDF Warning: Product "${product.name || product.id || 'Unknown'}" has invalid image height:`, product.image.height);
            return;
        }

        try {
            // Calculate positioning with padding on all sides
            const CELL_PADDING = 10; // Should match the padding used in calculateRowHeights
            const HORIZONTAL_PADDING = 8; // Horizontal padding for left and right
            
            // Updated column area for the image (adjusted for new column widths)
            // ARTICULO: 20% + MARCA: 15% = 35% of total width before IMAGEN column
            const originalXPosition = 265; // Shifted from 235 to account for wider MARCA column
            const originalImageWidth = 117;
            
            // Calculate new positioning with horizontal padding
            const availableWidth = originalImageWidth - (HORIZONTAL_PADDING * 2);
            const xPosition = originalXPosition + HORIZONTAL_PADDING; // Add left padding
            const yPosition = y + CELL_PADDING; // Add top padding
            const imageWidth = availableWidth; // Reduce width to accommodate horizontal padding
            
            // Check if image fits on current page (including padding)
            if (yPosition + imageHeight + CELL_PADDING > this.contentEndY) {
                return;
            }
            
            // Add the image with calculated positioning and padding
            this.doc.addImage(
                product.image.base64String, 
                "PNG", 
                xPosition, 
                yPosition, 
                imageWidth, 
                imageHeight
            );
            
            
        } catch (error) {
            console.error(`PDF Error: Failed to add image for product "${product.name || product.id || 'Unknown'} ${product.id}":`, error);
            // Don't throw the error to prevent PDF generation from failing
        }
    }

    DownloadPdf(fileName: string): void
    {
        this.doc.save(fileName);
    }

    ToBlob(): Blob
    {
        return this.doc.output('blob');
    }

    // Additional utility methods
    GetAvailableSpace(): number
    {
        return this.contentEndY - this.currentY;
    }

    GetPageDimensions(): { width: number, height: number }
    {
        return { width: this.layout.width, height: this.layout.height };
    }

    GetContentArea(): { x: number, y: number, width: number, height: number }
    {
        return {
            x: this.layout.leftMargin,
            y: this.contentStartY,
            width: this.layout.width - this.layout.leftMargin - this.layout.rightMargin,
            height: this.contentEndY - this.contentStartY
        };
    }

    // Method to add custom content with automatic positioning
    AddCustomContent(drawFunction: (doc: jsPDF, x: number, y: number) => number): void
    {
        const contentHeight = drawFunction(this.doc, this.layout.leftMargin, this.currentY);
        this.currentY += contentHeight;
    }
}